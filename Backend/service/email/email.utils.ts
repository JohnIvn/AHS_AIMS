import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"My App" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAppointmentEmail(
  to: string,
  appointment: any,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"My App" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Appointment Confirmation',
    text: `Your appointment has been scheduled. Details: ${JSON.stringify(appointment)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Appointment Confirmation</h2>
        <p>Dear ${appointment.firstName || ''} ${appointment.lastName || ''},</p>
        <p>Your appointment has been scheduled with the following details:</p>
        <ul>
          <li><strong>Subject:</strong> ${appointment.appointment_subject || ''}</li>
          <li><strong>Type:</strong> ${appointment.appointment_type || ''}</li>
          <li><strong>Branch:</strong> ${appointment.branch || ''}</li>
          <li><strong>Date:</strong> ${appointment.date || ''}</li>
          <li><strong>Time:</strong> ${appointment.time_slot || ''}</li>
          <li><strong>Social Link:</strong> ${appointment.social_link || ''}</li>
          <li><strong>Zoom Link:</strong> ${appointment.zoom_link || ''}</li>
        </ul>
        <p style="color: #666; font-size: 14px;">If you need to cancel or reschedule, please contact us.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"My App" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Password Reset Code',
    text: `Your password reset code is: ${code}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Your password reset code is:</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; color: #333; letter-spacing: 5px;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request a password reset, you can ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordChangedEmail(to: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"My App" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Your password was changed',
    text: 'This is a confirmation that your password was recently changed. If you did not make this change, please reset your password immediately or contact support.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>
          This is a confirmation that your password was recently changed.
          If you did not make this change, please reset your password immediately or contact support.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAppointmentDecisionEmail(
  to: string,
  details: {
    status: 'accepted' | 'denied';
    firstName?: string;
    lastName?: string;
    reason?: string;
    date?: string;
    time?: string;
    notes?: string;
  },
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const subject =
    details.status === 'accepted'
      ? 'Your appointment request has been accepted'
      : 'Your appointment request has been denied';

  const fullName =
    `${details.firstName || ''} ${details.lastName || ''}`.trim();
  const reason = details.reason
    ? `<li><strong>Reason:</strong> ${details.reason}</li>`
    : '';
  const date = details.date
    ? `<li><strong>Date:</strong> ${details.date}</li>`
    : '';
  const time = details.time
    ? `<li><strong>Time:</strong> ${details.time}</li>`
    : '';
  const notes = details.notes ? `<p>${details.notes}</p>` : '';

  const friendly =
    details.status === 'accepted'
      ? 'We look forward to seeing you at your scheduled time.'
      : 'Unfortunately, we are unable to accommodate your requested appointment. Please consider submitting a new request or contacting us for alternatives.';

  const mailOptions = {
    from: `"My App" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text: `${fullName ? `Hello ${fullName}, ` : 'Hello,'} Your appointment request has been ${details.status}. ${details.reason ? `Reason: ${details.reason}. ` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="margin-bottom: 8px;">Appointment ${details.status === 'accepted' ? 'Accepted' : 'Denied'}</h2>
        <p>${fullName ? `Hello ${fullName},` : 'Hello,'}</p>
        <p>Your appointment request has been <strong>${details.status}</strong>.</p>
        <ul>
          ${date}
          ${time}
          ${reason}
        </ul>
        ${notes}
        <p style="color: #666; font-size: 14px;">${friendly}</p>
      </div>
    `,
  } as nodemailer.SendMailOptions;

  await transporter.sendMail(mailOptions);
}
