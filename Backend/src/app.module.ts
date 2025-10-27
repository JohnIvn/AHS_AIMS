import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GoogleFormsService } from '../service/google/google-forms.service';
import { EmailService } from '../service/email/email.service';

import { GoogleFormsController } from '../controllers/google-forms.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [GoogleFormsController],
  providers: [GoogleFormsService, EmailService],
})
export class AppModule {}
