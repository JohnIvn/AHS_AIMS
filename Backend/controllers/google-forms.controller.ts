import { Controller, Get } from '@nestjs/common';
import chalk from 'chalk';
import { GoogleFormsService } from '../service/google/google-forms.service';

console.log(
  chalk.bgGreen.black('[CONTROLLER]') + '  - Google Forms controller loaded',
);

@Controller('google-forms')
export class GoogleFormsController {
  constructor(private readonly googleFormsService: GoogleFormsService) {}

  @Get('responses')
  async getResponses() {
    const sheetId = process.env.SHEET_ID;
    const range = process.env.RANGE;

    if (!sheetId || !range) {
      throw new Error(
        'Missing environment variables. Please check SHEET_ID and RANGE in your .env file',
      );
    }

    // console.log(`Using Sheet ID: ${sheetId}`);
    // console.log(`Using Range: ${range}`);

    return await this.googleFormsService.getFormResponses(sheetId, range);
  }

  @Get('sheets')
  async getSheetNames() {
    const sheetId =
      process.env.SHEET_ID || '1xhyld-hOL0iGYYNKx7haac37sKQtmKtqeYa3tqCmdWg';

    if (!sheetId) {
      throw new Error('SHEET_ID environment variable is required');
    }

    return await this.googleFormsService.getSheetNames(sheetId);
  }

  @Get('test')
  async testConnection() {
    const sheetId = process.env.SHEET_ID;
    const range = process.env.RANGE;

    if (!sheetId || !range) {
      return {
        status: 'error',
        message: 'Missing environment variables',
        missing: {
          SHEET_ID: !sheetId,
          RANGE: !range,
        },
      };
    }

    try {
      const result = await this.googleFormsService.getFormResponses(
        sheetId,
        range,
      );
      return {
        status: 'success',
        message: 'Successfully connected to Google Sheets',
        sheetId: sheetId,
        range: range,
        data: result,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Failed to connect to Google Sheets',
        sheetId: sheetId,
        range: range,
        error: error.message,
      };
    }
  }

  @Get('config')
  async getConfig() {
    return {
      SHEET_ID: process.env.SHEET_ID ? '✓ Set' : '✗ Missing',
      RANGE: process.env.RANGE ? '✓ Set' : '✗ Missing',
      NODE_ENV: process.env.NODE_ENV || 'development',
    };
  }
}
