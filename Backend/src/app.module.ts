import { Module } from '@nestjs/common';

import { GoogleFormsService } from '../service/google-forms.service';

import { GoogleFormsController } from '../controllers/google-forms.controller';

@Module({
  imports: [],
  controllers: [GoogleFormsController],
  providers: [GoogleFormsService],
})
export class AppModule {}
