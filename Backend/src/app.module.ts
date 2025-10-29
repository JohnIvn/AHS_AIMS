import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseService } from 'service/database/database.service';
import { GoogleFormsService } from '../service/google/google-forms.service';
import { EmailService } from '../service/email/email.service';
import { PrismaService } from 'service/prisma/prisma.service';

import { GoogleFormsController } from '../controllers/google-forms.controller';
import { SignInController } from '../controllers/signin.controller';
import { SignUpStaffController } from '../controllers/signup.controller';
import { ForgotPasswordController } from '../controllers/forgot-password.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'devsecret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    GoogleFormsController,
    SignInController,
    SignUpStaffController,
    ForgotPasswordController,
  ],
  providers: [GoogleFormsService, EmailService, DatabaseService, PrismaService],
})
export class AppModule {}
