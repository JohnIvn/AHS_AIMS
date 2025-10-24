import { Controller, Get, Query } from '@nestjs/common';
import { GoogleFormsService } from '../service/google-forms.service';

@Controller('google-forms')
export class GoogleFormsController {
  constructor(private readonly googleFormsService: GoogleFormsService) {}

  @Get('responses')
  async getResponses(@Query('sheetId') sheetId: string) {
    return await this.googleFormsService.getFormResponses(sheetId);
  }
}
