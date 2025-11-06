import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

console.log(
  chalk.bgBlue.black('[SERVICE]') + '     - Google Sheets service loaded',
);

@Injectable()
export class GoogleFormsService {
  private sheets;

  constructor() {
    const candidates = [
      path.resolve(__dirname, '../../../key.json'),
      path.resolve(process.cwd(), 'Backend', 'key.json'),
      path.resolve(process.cwd(), 'backend', 'key.json'),
      path.resolve(process.cwd(), 'key.json'),
    ];
    const keyFile = candidates.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    if (!keyFile) {
      throw new Error(
        `Google service account key.json not found. Looked in: \n${candidates.join('\n')}`,
      );
    }

    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async getFormResponses(sheetId: string, range: string) {
    try {
      // console.log(`Fetching from Sheet ID: ${sheetId}`);
      // console.log(`Range: ${range}`);

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        return {
          message: 'No data found in the sheet.',
          sheetId: sheetId,
          range: range,
        };
      }

      const headers = rows[0];
      const data = rows.slice(1).map((row, index) => {
        const obj = {
          id: index + 1,
        };
        headers.forEach((header, colIndex) => {
          const cleanHeader = header.trim().replace(/\s+/g, '_');
          obj[cleanHeader] = row[colIndex] || '';
        });
        return obj;
      });

      return {
        success: true,
        sheetId: sheetId,
        range: range,
        headers: headers,
        totalRecords: data.length,
        data: data,
      };
    } catch (error) {
      console.error('Google Sheets API Error:', error.message);

      if (error.message.includes('Unable to parse range')) {
        throw new Error(
          `Sheet name not found. Looking for range: "${range}". Please check the sheet name in your Google Sheets.`,
        );
      } else if (error.message.includes('Unable to read sheet')) {
        throw new Error(
          `No read access to spreadsheet: ${sheetId}. Check permissions.`,
        );
      } else if (error.message.includes('Requested entity was not found')) {
        throw new Error(
          `Spreadsheet not found: ${sheetId}. Check the Sheet ID.`,
        );
      } else {
        throw new Error(`Google Sheets API error: ${error.message}`);
      }
    }
  }

  async getSheetNames(sheetId: string) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      const sheets = response.data.sheets.map((sheet) => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
        index: sheet.properties.index,
      }));

      return {
        success: true,
        spreadsheetId: sheetId,
        sheets: sheets,
        totalSheets: sheets.length,
      };
    } catch (error) {
      console.error('Error fetching sheet names:', error.message);
      throw new Error(`Failed to get sheet names: ${error.message}`);
    }
  }

  /**
   * Write blocked dates and time slots to a Google Sheet
   * This data will be read by Apps Script to update the Google Form
   */
  async syncAvailabilityToSheet(
    sheetId: string,
    blockedDates: Array<{ date: string; reason?: string }>,
    blockedSlots: Array<{ date: string; start: string; end: string; reason?: string }>,
  ) {
    try {
      const sheetName = 'Availability_Data';

      // Prepare blocked dates data
      const dateRows = [
        ['Blocked Dates', 'Reason'],
        ...blockedDates.map((d) => [d.date, d.reason || '']),
      ];

      // Prepare blocked slots data (with some spacing)
      const slotRows = [
        [''], // Empty row for spacing
        ['Blocked Time Slots', 'Start Time', 'End Time', 'Reason'],
        ...blockedSlots.map((s) => [s.date, s.start, s.end, s.reason || '']),
      ];

      const allRows = [...dateRows, ...slotRows];

      // Check if sheet exists, if not create it
      try {
        await this.sheets.spreadsheets.get({
          spreadsheetId: sheetId,
          ranges: [`${sheetName}!A1`],
        });
      } catch (error) {
        // Sheet doesn't exist, create it
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });
      }

      // Clear existing data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:Z`,
      });

      // Write new data
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: allRows,
        },
      });

      return {
        success: true,
        message: 'Availability data synced to Google Sheets',
        sheetName,
        blockedDatesCount: blockedDates.length,
        blockedSlotsCount: blockedSlots.length,
      };
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error.message);
      throw new Error(`Failed to sync availability: ${error.message}`);
    }
  }
}
