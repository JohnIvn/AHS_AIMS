import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import chalk from 'chalk';
import { PrismaService } from 'service/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      success: true,
      message: `Appointment marked as ${status}`,
      data: record,
    };
  }
}
