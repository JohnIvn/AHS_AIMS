import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
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
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  @Post('check-email-staff')
  async checkEmail(@Body() body: { email: string }) {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        'SELECT email FROM staff_account WHERE email = $1',
        [body.email],
      );

      return {
        success: true,
        isAvailable: result.rows.length === 0,
        message:
          result.rows.length > 0
            ? 'Email already registered'
            : 'Email available',
      };
    } catch (error) {
      console.error(chalk.red('[ERROR] Checking email:'), error);
      return { success: false, message: 'Error checking email availability' };
    }
  }

  @Post('check-phone-staff')
  async checkPhone(@Body() body: { contact_number: string }) {
    const client = this.dbService.getClient();

    try {
      const result = await client.query(
        'SELECT contact_number FROM staff_account WHERE contact_number = $1',
        [body.contact_number],
      );

      return {
        success: true,
        isAvailable: result.rows.length === 0,
        message:
          result.rows.length > 0
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
    const client = this.dbService.getClient();

    try {
      await this.cleanupExpiredCodes();

      const existingStaff = await client.query(
        'SELECT staff_id FROM staff_account WHERE email = $1',
        [body.email],
      );

      if (existingStaff.rows.length > 0) {
        return {
          success: false,
          message:
            'This email is already registered. Please use a different email or sign in.',
        };
      }

      const code = await this.emailService.sendVerification(body.email);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const existingCode = await client.query(
        'SELECT id FROM verification_code WHERE email = $1',
        [body.email],
      );

      if (existingCode.rows.length > 0) {
        await client.query(
          `UPDATE verification_code 
           SET code = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP
           WHERE email = $3`,
          [code, expiresAt, body.email],
        );
      } else {
        const id = randomUUID();
        await client.query(
          `INSERT INTO verification_code (id, email, code, created_at, expires_at, used)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, false)`,
          [id, body.email, code, expiresAt],
        );
      }

      return { success: true, message: 'Verification code sent to your email' };
    } catch (error) {
      console.error(chalk.red('[ERROR] Sending verification code:'), error);
      return { success: false, message: 'Failed to send verification code' };
    }
  }

  @Post('signupst')
  async signUp(@Body() body: SignUpDto) {
    const client = this.dbService.getClient();

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

      const codeResult = await client.query(
        `SELECT code, expires_at FROM verification_code 
         WHERE email = $1 
         ORDER BY created_at DESC
         LIMIT 1`,
        [body.email],
      );

      if (codeResult.rows.length === 0) {
        return {
          success: false,
          message: 'No verification code found. Please request a new one.',
        };
      }

      const storedCode = codeResult.rows[0];

      if (new Date() > new Date(storedCode.expires_at)) {
        await client.query('DELETE FROM verification_code WHERE email = $1', [
          body.email,
        ]);
        return {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
        };
      }

      if (storedCode.code !== body.verificationCode) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      const emailCheck = await client.query(
        'SELECT staff_id FROM staff_account WHERE email = $1',
        [body.email],
      );

      if (emailCheck.rows.length > 0) {
        return {
          success: false,
          message: 'This email is already registered. Please sign in instead.',
        };
      }

      const phoneCheck = await client.query(
        'SELECT staff_id FROM staff_account WHERE contact_number = $1',
        [body.contact_number],
      );

      if (phoneCheck.rows.length > 0) {
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

      const result = await client.query(
        `
        INSERT INTO staff_account
          (staff_id, first_name, last_name, contact_number, email, password)
          VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING staff_id, email, first_name, last_name, contact_number
        `,
        [
          staffId,
          firstName,
          lastName,
          body.contact_number,
          body.email,
          hashedPassword,
        ],
      );

      const staff = result.rows[0];

      await client.query('DELETE FROM verification_code WHERE email = $1', [
        body.email,
      ]);

      const payload = { email: staff.email, role: 'staff' };
      const token = this.jwtService.sign(payload, { expiresIn: '1h' });

      return { success: true, token, staff };
    } catch (error: any) {
      console.error(chalk.red('[ERROR]'), error);

      if (error.code === '23505') {
        if (error.detail?.includes('(email)')) {
          return {
            success: false,
            message:
              'This email is already registered. Please sign in instead.',
          };
        } else if (error.detail?.includes('(contact_number)')) {
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
    const client = this.dbService.getClient();
    try {
      await client.query(
        'DELETE FROM verification_code WHERE expires_at < CURRENT_TIMESTAMP',
      );
    } catch (error) {
      console.error(chalk.red('[ERROR] Cleaning expired codes:'), error);
    }
  }
}
