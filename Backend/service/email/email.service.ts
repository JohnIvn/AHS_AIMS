import { Injectable } from '@nestjs/common';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendAppointmentEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from './email.utils';
import chalk from 'chalk';

console.log(chalk.bgBlue.black('[SERVICE]') + '     - Email service loaded');

@Injectable()
export class EmailService {
  async sendVerification(to: string): Promise<string> {
    const code = generateVerificationCode();
    await sendVerificationEmail(to, code);
    return code;
  }

  async sendAppointment(to: string, appointment: any): Promise<void> {
    await sendAppointmentEmail(to, appointment);
  }

  async sendPasswordReset(to: string): Promise<string> {
    const code = generateVerificationCode();
    await sendPasswordResetEmail(to, code);
    return code;
  }

  async sendPasswordChanged(to: string): Promise<void> {
    await sendPasswordChangedEmail(to);
  }
}
