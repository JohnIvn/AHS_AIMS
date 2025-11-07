import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../service/email/email.service';

@Controller('staff')
export class StaffController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private async verifyAdmin(authHeader: string): Promise<any> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.substring(7);
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Admin access required');
      }
      return payload;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllStaff(@Request() req) {
    try {
      await this.verifyAdmin(req.headers.authorization);

      const staff = await this.prisma.staff_account.findMany({
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_number: true,
          status: true,
          date_created: true,
        },
        orderBy: {
          date_created: 'desc',
        },
      });

      return {
        success: true,
        staff,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return {
          success: false,
          message: e.message,
        };
      }
      console.error('Get all staff error:', e);
      return {
        success: false,
        message: 'Failed to retrieve staff members',
      };
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getStaffById(@Param('id') id: string, @Request() req) {
    try {
      await this.verifyAdmin(req.headers.authorization);

      const staff = await this.prisma.staff_account.findUnique({
        where: { staff_id: id },
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_number: true,
          status: true,
          date_created: true,
        },
      });

      if (!staff) {
        return {
          success: false,
          message: 'Staff member not found',
        };
      }

      return {
        success: true,
        staff,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return {
          success: false,
          message: e.message,
        };
      }
      console.error('Get staff by ID error:', e);
      return {
        success: false,
        message: 'Failed to retrieve staff member',
      };
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStaff(@Body() body: any, @Request() req) {
    try {
      await this.verifyAdmin(req.headers.authorization);

      const { first_name, last_name, email, contact_number, password } = body;

      if (!first_name || !last_name || !email || !password) {
        return {
          success: false,
          message: 'First name, last name, email, and password are required',
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Invalid email format',
        };
      }

      if (password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters',
        };
      }

      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return {
          success: false,
          message: 'Password must include letters and numbers',
        };
      }

      if (contact_number) {
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(contact_number.replace(/\s+/g, ''))) {
          return {
            success: false,
            message: 'Invalid contact number format (use 09XXXXXXXXX)',
          };
        }
      }

      const existingEmail = await this.prisma.staff_account.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return {
          success: false,
          message: 'Email already registered',
        };
      }

      if (contact_number) {
        const existingPhone = await this.prisma.staff_account.findFirst({
          where: { contact_number },
        });

        if (existingPhone) {
          return {
            success: false,
            message: 'Contact number already registered',
          };
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const staff = await this.prisma.staff_account.create({
        data: {
          first_name,
          last_name,
          email,
          contact_number: contact_number || null,
          password: hashedPassword,
          status: 'active',
        },
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_number: true,
          status: true,
          date_created: true,
        },
      });

      try {
        await this.emailService.sendEmail(
          email,
          'Welcome to AHS AIMS',
          `Hello ${first_name} ${last_name},\n\nYour staff account has been created by an administrator.\n\nEmail: ${email}\n\nYou can now sign in to the system using your email and the password provided to you.\n\nBest regards,\nAHS AIMS Team`,
        );
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
      }

      return {
        success: true,
        message: 'Staff member created successfully',
        staff,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return {
          success: false,
          message: e.message,
        };
      }
      console.error('Create staff error:', e);
      return {
        success: false,
        message: 'Failed to create staff member',
      };
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateStaff(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    try {
      await this.verifyAdmin(req.headers.authorization);

      const { first_name, last_name, contact_number, password } = body;

      const existingStaff = await this.prisma.staff_account.findUnique({
        where: { staff_id: id },
      });

      if (!existingStaff) {
        return {
          success: false,
          message: 'Staff member not found',
        };
      }

      if (contact_number) {
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(contact_number.replace(/\s+/g, ''))) {
          return {
            success: false,
            message: 'Invalid contact number format (use 09XXXXXXXXX)',
          };
        }

        const existingPhone = await this.prisma.staff_account.findFirst({
          where: {
            contact_number,
            NOT: { staff_id: id },
          },
        });

        if (existingPhone) {
          return {
            success: false,
            message: 'Contact number already registered to another staff',
          };
        }
      }

      const updateData: any = {};

      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (contact_number !== undefined)
        updateData.contact_number = contact_number || null;

      if (password) {
        if (password.length < 8) {
          return {
            success: false,
            message: 'Password must be at least 8 characters',
          };
        }

        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
          return {
            success: false,
            message: 'Password must include letters and numbers',
          };
        }

        updateData.password = await bcrypt.hash(password, 10);

        try {
          await this.emailService.sendEmail(
            existingStaff.email,
            'Password Updated',
            `Hello ${existingStaff.first_name} ${existingStaff.last_name},\n\nYour password has been updated by an administrator.\n\nIf you did not request this change, please contact the administrator immediately.\n\nBest regards,\nAHS AIMS Team`,
          );
        } catch (emailError) {
          console.warn('Failed to send password change email:', emailError);
        }
      }

      const staff = await this.prisma.staff_account.update({
        where: { staff_id: id },
        data: updateData,
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_number: true,
          status: true,
          date_created: true,
        },
      });

      return {
        success: true,
        message: 'Staff member updated successfully',
        staff,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return {
          success: false,
          message: e.message,
        };
      }
      console.error('Update staff error:', e);
      return {
        success: false,
        message: 'Failed to update staff member',
      };
    }
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStaffStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    try {
      await this.verifyAdmin(req.headers.authorization);

      const { status } = body;

      if (!status || !['active', 'inactive'].includes(status)) {
        return {
          success: false,
          message: 'Invalid status. Must be "active" or "inactive"',
        };
      }

      const existingStaff = await this.prisma.staff_account.findUnique({
        where: { staff_id: id },
      });

      if (!existingStaff) {
        return {
          success: false,
          message: 'Staff member not found',
        };
      }

      const staff = await this.prisma.staff_account.update({
        where: { staff_id: id },
        data: { status },
        select: {
          staff_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_number: true,
          status: true,
          date_created: true,
        },
      });

      try {
        const statusText = status === 'active' ? 'activated' : 'deactivated';
        await this.emailService.sendEmail(
          existingStaff.email,
          `Account ${statusText}`,
          `Hello ${existingStaff.first_name} ${existingStaff.last_name},\n\nYour account has been ${statusText} by an administrator.\n\n${
            status === 'active'
              ? 'You can now sign in to the system.'
              : 'You will not be able to sign in until your account is reactivated.'
          }\n\nIf you have any questions, please contact the administrator.\n\nBest regards,\nAHS AIMS Team`,
        );
      } catch (emailError) {
        console.warn('Failed to send status change email:', emailError);
      }

      return {
        success: true,
        message: `Staff member ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        staff,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return {
          success: false,
          message: e.message,
        };
      }
      console.error('Update staff status error:', e);
      return {
        success: false,
        message: 'Failed to update staff status',
      };
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteStaff(@Param('id') id: string, @Request() req) {
    try {
      await this.verifyAdmin(req.headers.authorization);

      const existingStaff = await this.prisma.staff_account.findUnique({
        where: { staff_id: id },
      });

      if (!existingStaff) {
        return {
          success: false,
          message: 'Staff member not found',
        };
      }

      await this.prisma.staff_account.delete({
        where: { staff_id: id },
      });

      try {
        await this.emailService.sendEmail(
          existingStaff.email,
          'Account Deleted',
          `Hello ${existingStaff.first_name} ${existingStaff.last_name},\n\nYour staff account has been deleted by an administrator.\n\nIf you believe this was done in error, please contact the administrator.\n\nBest regards,\nAHS AIMS Team`,
        );
      } catch (emailError) {
        console.warn('Failed to send deletion email:', emailError);
      }

      return {
        success: true,
        message: 'Staff member deleted successfully',
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return {
          success: false,
          message: e.message,
        };
      }
      console.error('Delete staff error:', e);
      return {
        success: false,
        message: 'Failed to delete staff member',
      };
    }
  }
}
