import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import chalk from 'chalk';
import { PrismaService } from 'service/prisma/prisma.service';
import { EmailService } from 'service/email/email.service';

console.log(
  chalk.bgGreen.black('[CONTROLLER]') + '  - Appointments controller loaded',
);

type DecisionBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: string;
  reason?: string;
  status?: 'accepted' | 'denied';
};

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Post('decision')
  @HttpCode(200)
  async recordDecision(@Body() body: DecisionBody) {
    const email = (body.email || '').trim().toLowerCase();
    const status = (body.status || '').toLowerCase() as 'accepted' | 'denied';

    if (!email) {
      throw new BadRequestException('Email is required');
    }
    if (!['accepted', 'denied'].includes(status)) {
      throw new BadRequestException('Status must be accepted or denied');
    }

    const firstName = (body.firstName || '').trim() || 'Unknown';
    const lastName = (body.lastName || '').trim() || 'Unknown';
    const contactNumber = (body.contactNumber || '').trim() || null;
    const reason = (body.reason || '').trim() || null;

    const existing = await (this.prisma as any).appoinment_details.findUnique({
      where: { email },
      select: { status: true },
    });
    if (
      existing &&
      ['accepted', 'denied'].includes((existing.status || '').toLowerCase())
    ) {
      throw new BadRequestException(
        `Appointment already decided as ${existing.status}.`,
      );
    }

    const record = await (this.prisma as any).appoinment_details.upsert({
      where: { email },
      update: {
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        reason: reason,
        status: status,
      },
      create: {
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        email,
        reason: reason,
        status: status,
      },
    });

    try {
      await this.emailService.sendAppointmentDecision(email, {
        status,
        firstName,
        lastName,
        reason: reason || undefined,
      });
    } catch (e) {
      console.error('[EMAIL] Failed to send decision email:', e?.message || e);
    }

    return {
      success: true,
      message: `Appointment marked as ${status}`,
      data: record,
    };
  }

  @Post('check')
  @HttpCode(200)
  async checkExisting(@Body() body: { emails?: string[] }) {
    const emails = (body.emails || [])
      .map((e) => (e || '').trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return { items: [] };

    const existing = await (this.prisma as any).appoinment_details.findMany({
      where: { email: { in: emails } },
      select: { email: true, status: true },
    });

    const map: Record<
      string,
      { email: string; status: string; decided: boolean }
    > = {};
    for (const row of existing) {
      const status = (row.status || '').toLowerCase();
      map[row.email.toLowerCase()] = {
        email: row.email,
        status,
        decided: true,
      };
    }

    return {
      items: emails.map((e) =>
        map[e] ? map[e] : { email: e, status: 'pending', decided: false },
      ),
    };
  }
}
