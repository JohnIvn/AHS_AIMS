import { Body, Controller, Get, Headers, Post, Put } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'service/prisma/prisma.service';
import chalk from 'chalk';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../service/email/email.service';

console.log(
  chalk.bgGreen.black('[CONTROLLER]') + '  - Profile controller loaded',
);

interface UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  contact_number?: string | null;
}

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private getEmailFromAuthHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer') return null;
    try {
      const payload = this.jwtService.verify(token);
      return payload?.email || null;
    } catch (e) {
      return null;
    }
  }

  @Get('me')
  async getMe(@Headers('authorization') authorization?: string) {
    const email = this.getEmailFromAuthHeader(authorization);
    if (!email) return { success: false, message: 'Unauthorized' };

    const user = await this.prisma.staff_account.findUnique({
      where: { email },
      select: {
        staff_id: true,
        email: true,
        first_name: true,
        last_name: true,
        contact_number: true,
        status: true,
        date_created: true,
      },
    });

    if (!user) return { success: false, message: 'User not found' };
    return { success: true, user };
  }

  @Put()
  async update(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: UpdateProfileDto,
  ) {
    const email = this.getEmailFromAuthHeader(authorization);
    if (!email) return { success: false, message: 'Unauthorized' };

    try {
      const updated = await this.prisma.staff_account.update({
        where: { email },
        data: {
          first_name: body.first_name ?? undefined,
          last_name: body.last_name ?? undefined,
          contact_number:
            body.contact_number === undefined ? undefined : body.contact_number,
        },
        select: {
          staff_id: true,
          email: true,
          first_name: true,
          last_name: true,
          contact_number: true,
          status: true,
          date_created: true,
        },
      });
      return { success: true, user: updated };
    } catch (e) {
      console.error(chalk.red('[ERROR] Updating profile:'), e);
      return { success: false, message: 'Failed to update profile' };
    }
  }

  @Post('change-password')
  async changePassword(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      current_password: string;
      new_password: string;
    },
  ) {
    const email = this.getEmailFromAuthHeader(authorization);
    if (!email) return { success: false, message: 'Unauthorized' };

    if (!body?.current_password || !body?.new_password) {
      return { success: false, message: 'Missing required fields' };
    }

    if (body.new_password.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters',
      };
    }

    const hasLetters = /[A-Za-z]/.test(body.new_password || '');
    const hasDigits = /\d/.test(body.new_password || '');
    if (!(hasLetters && hasDigits)) {
      return {
        success: false,
        message: 'New password must include letters and numbers',
      };
    }

    try {
      const account = await this.prisma.staff_account.findUnique({
        where: { email },
        select: { password: true, email: true },
      });
      if (!account) return { success: false, message: 'User not found' };

      const ok = await bcrypt.compare(body.current_password, account.password);
      if (!ok)
        return { success: false, message: 'Current password is incorrect' };

      const hashed = await bcrypt.hash(body.new_password, 10);
      await this.prisma.staff_account.update({
        where: { email },
        data: { password: hashed },
      });

      try {
        await this.emailService.sendPasswordChanged(email);
      } catch (e) {
        console.warn('[WARN] Failed to send password change email');
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (e) {
      console.error(chalk.red('[ERROR] Changing password:'), e);
      return { success: false, message: 'Failed to change password' };
    }
  }
}
