import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GoogleFormsService } from '../service/google-forms.service';

import { GoogleFormsController } from '../controllers/google-forms.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
  ],
  controllers: [GoogleFormsController],
  providers: [GoogleFormsService],
})
export class AppModule {}
