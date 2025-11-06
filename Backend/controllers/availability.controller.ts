import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import chalk from 'chalk';
import { PrismaService } from 'service/prisma/prisma.service';

console.log(
  chalk.bgGreen.black('[CONTROLLER]') + '  - Availability controller loaded',
);

type BlockedDateInput = {
  date: string;
  reason?: string;
};

type BlockedSlotInput = {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
};

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAll() {
    const [dates, slots] = await Promise.all([
      (this.prisma as any).blocked_dates.findMany({
        orderBy: { date: 'asc' },
      }),
      (this.prisma as any).blocked_time_slots.findMany({
        orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
      }),
    ]);

    return {
      days: dates.map((d) => ({
        id: d.id,
        date: d.date.toISOString().split('T')[0],
        reason: d.reason,
      })),
      slots: slots.map((s) => ({
        id: s.id,
        date: s.date.toISOString().split('T')[0],
        start: s.start_time,
        end: s.end_time,
        reason: s.reason,
      })),
    };
  }

  @Get('check')
  async checkAvailability(
    @Query('date') dateStr: string,
    @Query('time') time?: string,
  ) {
    if (!dateStr) {
      throw new BadRequestException('Date is required');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const blockedDate = await (this.prisma as any).blocked_dates.findUnique({
      where: { date },
    });

    if (blockedDate) {
      return {
        available: false,
        reason: blockedDate.reason || 'Date is blocked',
        type: 'full_day',
      };
    }

    if (time) {
      const timeInMinutes = this.timeToMinutes(time);
      if (timeInMinutes === null) {
        throw new BadRequestException('Invalid time format');
      }

      const slots = await (this.prisma as any).blocked_time_slots.findMany({
        where: { date },
      });

      for (const slot of slots) {
        const slotStart = this.timeToMinutes(slot.start_time);
        const slotEnd = this.timeToMinutes(slot.end_time);

        if (slotStart !== null && slotEnd !== null && timeInMinutes >= slotStart && timeInMinutes < slotEnd) {
          return {
            available: false,
            reason: slot.reason || 'Time slot is blocked',
            type: 'time_slot',
            slot: {
              start: slot.start_time,
              end: slot.end_time,
            },
          };
        }
      }
    }

    return { available: true };
  }

  @Post('dates')
  @HttpCode(201)
  async addBlockedDate(@Body() body: BlockedDateInput) {
    const { date: dateStr, reason } = body;

    if (!dateStr) {
      throw new BadRequestException('Date is required');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    try {
      const created = await (this.prisma as any).blocked_dates.create({
        data: {
          date,
          reason: reason?.trim() || null,
        },
      });

      return {
        success: true,
        data: {
          id: created.id,
          date: created.date.toISOString().split('T')[0],
          reason: created.reason,
        },
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('This date is already blocked');
      }
      throw error;
    }
  }

  @Delete('dates/:id')
  @HttpCode(200)
  async removeBlockedDate(@Param('id') id: string) {
    try {
      await (this.prisma as any).blocked_dates.delete({
        where: { id },
      });
      return { success: true, message: 'Blocked date removed' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Blocked date not found');
      }
      throw error;
    }
  }

  @Post('slots')
  @HttpCode(201)
  async addBlockedSlot(@Body() body: BlockedSlotInput) {
    const { date: dateStr, startTime, endTime, reason } = body;

    if (!dateStr || !startTime || !endTime) {
      throw new BadRequestException('Date, startTime, and endTime are required');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null) {
      throw new BadRequestException('Invalid time format');
    }

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('End time must be after start time');
    }

    const existingSlots = await (this.prisma as any).blocked_time_slots.findMany({
      where: { date },
    });

    for (const slot of existingSlots) {
      const slotStart = this.timeToMinutes(slot.start_time);
      const slotEnd = this.timeToMinutes(slot.end_time);

      if (slotStart !== null && slotEnd !== null && Math.max(slotStart, startMinutes) < Math.min(slotEnd, endMinutes)) {
        throw new BadRequestException(
          'This time slot overlaps with an existing blocked slot',
        );
      }
    }

    const created = await (this.prisma as any).blocked_time_slots.create({
      data: {
        date,
        start_time: startTime,
        end_time: endTime,
        reason: reason?.trim() || null,
      },
    });

    return {
      success: true,
      data: {
        id: created.id,
        date: created.date.toISOString().split('T')[0],
        start: created.start_time,
        end: created.end_time,
        reason: created.reason,
      },
    };
  }

  @Delete('slots/:id')
  @HttpCode(200)
  async removeBlockedSlot(@Param('id') id: string) {
    try {
      await (this.prisma as any).blocked_time_slots.delete({
        where: { id },
      });
      return { success: true, message: 'Blocked time slot removed' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Blocked time slot not found');
      }
      throw error;
    }
  }

  @Delete('clear')
  @HttpCode(200)
  async clearAll() {
    await Promise.all([
      (this.prisma as any).blocked_dates.deleteMany({}),
      (this.prisma as any).blocked_time_slots.deleteMany({}),
    ]);
    return {
      success: true,
      message: 'All availability blocks cleared',
    };
  }

  private timeToMinutes(time: string): number | null {
    const parts = (time || '').split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }
}
