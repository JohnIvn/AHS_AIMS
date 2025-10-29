import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from 'service/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { EmailService } from '../service/email/email.service';

console.log(chalk.bgGreen.black('[CONTROLLER] SignUp staff controller loaded'));

interface SignUpDto {
  first_name: string;
  last_name: string;
  contact_number: string;
  email: string;
  password: string;
  verificationCode?: string;
}

@Controller('auth')
export class SignUpStaffController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  @Post('check-email-staff')
  async checkEmail(@Body() body: { email: string }) {
    try {
      const existing = await this.prisma.staff_account.findUnique({
        where: { email: body.email },
        select: { email: true },
      });

      return {
        success: true,
        isAvailable: !existing,
        message: existing ? 'Email already registered' : 'Email available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking email:'), error);
      return { success: false, message: 'Error checking email availability' };
    }
  }

  @Post('check-phone-staff')
  async checkPhone(@Body() body: { contact_number: string }) {
    try {
      const existing = await this.prisma.staff_account.findFirst({
        where: { contact_number: body.contact_number || undefined },
        select: { contact_number: true },
      });

      return {
        success: true,
        isAvailable: !existing,
        message: existing
          ? 'Phone number already registered'
          : 'Phone number available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking phone:'), error);
      return {
        success: false,
        message: 'Error checking phone number availability',
      };
    }
  }

  @Post('send-verification-staff')
  async sendVerification(@Body() body: { email: string }) {
    try {
      await this.cleanupExpiredCodes();

      const existingStaff = await this.prisma.staff_account.findUnique({
        where: { email: body.email },
        select: { staff_id: true },
      });

      if (existingStaff) {
        return {
          success: false,
          message:
            'This email is already registered. Please use a different email or sign in.',
        };
      }

      const code = await this.emailService.sendVerification(body.email);

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
            id: randomUUID(),
            email: body.email,
            code,
            created_at: new Date(),
            expires_at: expiresAt,
            used: false,
          },
        });
      }

      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Sending verification code:'), error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  @Post('signupst')
  async signUp(@Body() body: SignUpDto) {
    try {
      if (!body.contact_number || body.contact_number.trim() === '') {
        return {
          success: false,
          message: 'Contact number is required',
        };
      }

      if (!body.verificationCode) {
        return {
          success: false,
          message: 'Verification code is required',
        };
      }

      await this.cleanupExpiredCodes();

      const latestCode = await this.prisma.verification_code.findFirst({
        where: { email: body.email },
        orderBy: { created_at: 'desc' },
        select: { code: true, expires_at: true, id: true },
      });

      if (!latestCode) {
        return {
          success: false,
          message: 'No verification code found. Please request a new one.',
        };
      }

      if (new Date() > new Date(latestCode.expires_at)) {
        await this.prisma.verification_code.deleteMany({
          where: { email: body.email },
        });
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
        };
      }

      if (latestCode.code !== body.verificationCode) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      const emailCheck = await this.prisma.staff_account.findUnique({
        where: { email: body.email },
        select: { staff_id: true },
      });

      if (emailCheck) {
        return {
          success: false,
          message: 'This email is already registered. Please sign in instead.',
        };
      }

      const phoneCheck = await this.prisma.staff_account.findFirst({
        where: { contact_number: body.contact_number },
        select: { staff_id: true },
      });

      if (phoneCheck) {
        return {
          success: false,
          message:
            'This phone number is already registered. Please use a different phone number.',
        };
      }

      const hashedPassword = await bcrypt.hash(body.password, 10);
      const staffId = randomUUID();
      const firstName = (body as any).first_name ?? (body as any).f_name;
      const lastName = (body as any).last_name ?? (body as any).l_name;

      const staff = await this.prisma.staff_account.create({
        data: {
          staff_id: staffId,
          first_name: firstName,
          last_name: lastName,
          contact_number: body.contact_number,
          email: body.email,
          password: hashedPassword,
        },
        select: {
          staff_id: true,
          email: true,
          first_name: true,
          last_name: true,
          contact_number: true,
        },
      });

      await this.prisma.verification_code.deleteMany({
        where: { email: body.email },
      });

      const payload = { email: staff.email, role: 'staff' };
      const token = this.jwtService.sign(payload, { expiresIn: '1h' });

      return { success: true, token, staff };
    } catch (error: any) {
      console.error(chalk.red('[ERROR]'), error);

      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const target = (error.meta?.target || []) as string[];
        if (
          target.includes('staff_account_email_key') ||
          target.includes('email')
        ) {
          return {
            success: false,
            message:
              'This email is already registered. Please sign in instead.',
          };
        }
        if (target.includes('contact_number')) {
          return {
            success: false,
            message:
              'This phone number is already registered. Please use a different phone number.',
          };
        }
      }

      return {
        success: false,
        message: 'Error creating staff. Please try again later.',
      };
    }
  }

  private async cleanupExpiredCodes() {
    try {
      await this.prisma.verification_code.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });
    } catch (error) {
      console.error(chalk.red('[ERROR] Cleaning expired codes:'), error);
    }
  }
}
