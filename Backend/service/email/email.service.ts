import { Injectable } from '@nestjs/common';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendAppointmentEmail,
} from './email.utils';
import chalk from 'chalk';

console.log(chalk.bgBlue.black('[SERVICE] Email service loaded'));

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
}
