import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from 'service/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import { JwtService } from '@nestjs/jwt';

console.log(
  chalk.bgGreen.black('[CONTROLLER]') + '  - SignIn controller loaded',
);


interface SignInDto {
  email: string;
  password: string;
}

interface User {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

@Controller('auth')
export class SignInController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    try {
      // First, try to find admin account
      let foundAdmin = await this.prisma.admin_account.findUnique({
        where: { email: body.email },
      });

      let role = 'staff';
      let user: User | null = null;

      if (foundAdmin) {
        // Admin account found
        user = foundAdmin as unknown as User;
        role = 'admin';

        // Check if admin account is active
        if (foundAdmin.status !== 'active') {
          return { success: false, message: 'Account is inactive' };
        }
      } else {
        // Try staff account
        const foundStaff = await this.prisma.staff_account.findUnique({
          where: { email: body.email },
        });

        if (foundStaff) {
          user = foundStaff as unknown as User;
          role = 'staff';

          // Check if staff account is active
          if (foundStaff.status !== 'active') {
            return { success: false, message: 'Account is inactive' };
          }
        }
      }

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const passwordMatches = await bcrypt.compare(
        body.password,
        user.password,
      );
      if (!passwordMatches) {
        return { success: false, message: 'Incorrect password' };
      }

      const payload = { email: user.email, role };
      const token = this.jwtService.sign(payload, { expiresIn: '1h' });

      return {
        success: true,
        token,
        user: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: role,
        },
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'SignIn error' };
    }
  }
}
