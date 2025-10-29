import { Body, Controller, Post } from '@nestjs/common';
import chalk from 'chalk';
import { PrismaService } from 'service/prisma/prisma.service';
import { EmailService } from '../service/email/email.service';
import * as bcrypt from 'bcrypt';

console.log(
  chalk.bgGreen.black('[CONTROLLER] Forgot Password controller loaded'),
);

interface SendResetDto {
  email: string;
}

interface ResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

@Controller('auth')
export class ForgotPasswordController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private async cleanupExpiredCodes() {
    try {
      await this.prisma.verification_code.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });
    } catch (error) {
      console.error(
        chalk.red('[ERROR] Cleaning expired codes (forgot-password):'),
        error,
      );
    }
  }

  @Post('forgot-password')
  async sendReset(@Body() body: SendResetDto) {
    try {
      await this.cleanupExpiredCodes();

      const exists = await this.prisma.staff_account.findUnique({
        where: { email: body.email },
        select: { staff_id: true },
      });

      if (!exists) {
        return {
          success: true,
          message: 'If an account exists, a code has been sent.',
        };
      }

      const code = await this.emailService.sendPasswordReset(body.email);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const latest = await this.prisma.verification_code.findFirst({
        where: { email: body.email },
        orderBy: { created_at: 'desc' },
        select: { id: true },
      });

      if (latest) {
        await this.prisma.verification_code.update({
          where: { id: latest.id },
          data: {
            code,
            expires_at: expiresAt,
            created_at: new Date(),
            used: false,
          },
        });
      } else {
        await this.prisma.verification_code.create({
          data: {
            email: body.email,
            code,
            created_at: new Date(),
            expires_at: expiresAt,
            used: false,
          },
        });
      }

      return {
        success: true,
        message: 'If an account exists, a code has been sent.',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Sending password reset code:'), error);
      return {
        success: true,
        message: 'If an account exists, a code has been sent.',
      };
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      await this.cleanupExpiredCodes();

      const latest = await this.prisma.verification_code.findFirst({
        where: { email: body.email },
        orderBy: { created_at: 'desc' },
      });

      if (!latest) {
        return { success: false, message: 'Invalid or expired code.' };
      }

      if (latest.used) {
        return { success: false, message: 'Code already used.' };
      }

      if (new Date() > new Date(latest.expires_at)) {
        return { success: false, message: 'Code expired.' };
      }

      if (latest.code !== body.code) {
        return { success: false, message: 'Invalid code.' };
      }

      const account = await this.prisma.staff_account.findUnique({
        where: { email: body.email },
        select: { staff_id: true },
      });

      if (!account) {
        return { success: false, message: 'Account not found.' };
      }

      const hashed = await bcrypt.hash(body.newPassword, 10);

      await this.prisma.$transaction([
        this.prisma.staff_account.update({
          where: { email: body.email },
          data: { password: hashed },
        }),
        this.prisma.verification_code.update({
          where: { id: latest.id },
          data: { used: true },
        }),
        this.prisma.verification_code.deleteMany({
          where: { email: body.email, id: { not: latest.id } },
        }),
      ]);

      return { success: true, message: 'Password has been reset.' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Resetting password:'), error);
      return { success: false, message: 'Failed to reset password.' };
    }
  }
}
