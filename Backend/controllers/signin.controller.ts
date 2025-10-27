import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import * as bcrypt from 'bcrypt';
import chalk from 'chalk';
import { JwtService } from '@nestjs/jwt';

console.log(chalk.bgGreen.black('[CONTROLLER] SignIn controller loaded'));

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
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    const client = this.dbService.getClient();

    try {
      let result = await client.query(
        'SELECT * FROM staff_account WHERE email = $1',
        [body.email],
      );

      let role = 'user';
      let user: User | null = null;

      if (result.rows.length > 0) {
        user = result.rows[0];
      } else {
        result = await client.query(
          'SELECT * FROM staff_account WHERE email = $1',
          [body.email],
        );
        if (result.rows.length === 0) {
          return { success: false, message: 'User not found' };
        }
        user = result.rows[0];
        role = 'staff';
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
        },
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'SignIn error' };
    }
  }
}
