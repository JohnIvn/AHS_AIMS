/**
 * Google Apps Script to Update Form Based on Availability Data
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Form
 * 2. Click the three dots menu > Script editor
 * 3. Paste this code
 * 4. Update SPREADSHEET_ID and FORM_ID below
 * 5. Save and run 'setupTrigger' function once to set up automatic polling
 * 6. Authorize the script when prompted
 * 
 * The script will run every 5 minutes to update form options
 */

// ==================== CONFIGURATION ====================
const SPREADSHEET_ID = ''; // Replace with your Google Sheet ID
const FORM_ID = ''; // Replace with your Google Form ID
const SHEET_NAME = ''; // Name of the sheet with availability data
const DATE_QUESTION_TITLE = ''; // Title of the date question in your form

// ==================== MAIN FUNCTIONS ====================

/**
 * Main function that updates the form based on availability data
 * This will be called automatically by the trigger
 */
function updateFormAvailability() {
  try {
    Logger.log('Starting form update...');
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dataSheet = sheet.getSheetByName(SHEET_NAME);
    
    if (!dataSheet) {
      Logger.log(`Sheet "${SHEET_NAME}" not found. Make sure to sync availability data first.`);
      return;
    }
    
    // Read blocked dates from the sheet
    const blockedDates = getBlockedDates(dataSheet);
    Logger.log(`Found ${blockedDates.length} blocked dates: ${blockedDates.join(', ')}`);
    
    // Generate available date options (next 60 days, excluding blocked dates)
    const availableDates = generateAvailableDates(60, blockedDates);
    Logger.log(`Generated ${availableDates.length} available dates`);
    
    // Update the Google Form
    updateFormDateOptions(availableDates);
    
    Logger.log('Form updated successfully!');
  } catch (error) {
    Logger.log(`Error updating form: ${error.message}`);
  }
}

/**
 * Read blocked dates from the spreadsheet
 */
function getBlockedDates(dataSheet) {
  const blockedDates = [];
  
  // Read from row 2 onwards (row 1 is header "Blocked Dates | Reason")
  const lastRow = dataSheet.getLastRow();
  
  for (let i = 2; i <= lastRow; i++) {
    const cellValue = dataSheet.getRange(i, 1).getValue();
    
    // Stop when we hit the "Blocked Time Slots" section or empty row
    if (!cellValue || cellValue.toString().includes('Blocked Time Slots')) {
      break;
    }
    
    // Parse the date (format: YYYY-MM-DD)
    const dateStr = cellValue.toString().trim();
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      blockedDates.push(dateStr);
    }
  }
  
  return blockedDates;
}

/**
 * Generate available dates for the next N days, excluding blocked dates
 */
function generateAvailableDates(daysAhead, blockedDates) {
  const availableDates = [];
  const today = new Date();
  
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Format as YYYY-MM-DD
    const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Check if this date is blocked
    if (!blockedDates.includes(dateStr)) {
      // Format as a readable date for the form (e.g., "November 16, 2025")
      const readableDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM dd, yyyy');
      availableDates.push(readableDate);
    }
  }
  
  return availableDates;
}

/**
 * Update the Google Form with available date options
 */
function updateFormDateOptions(availableDates) {
  const form = FormApp.openById(FORM_ID);
  const items = form.getItems();
  
  // Find the date question by title
  let dateQuestion = null;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.getTitle() === DATE_QUESTION_TITLE) {
      // Check if it's a multiple choice or list question
      if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
        dateQuestion = item.asMultipleChoiceItem();
        break;
      } else if (item.getType() === FormApp.ItemType.LIST) {
        dateQuestion = item.asListItem();
        break;
      }
    }
  }
  
  if (!dateQuestion) {
    Logger.log(`Question with title "${DATE_QUESTION_TITLE}" not found or not a multiple choice/list question.`);
    Logger.log('Available questions in form:');
    items.forEach(item => Logger.log(`- ${item.getTitle()} (${item.getType()})`));
    return;
  }
  
  // Update the choices
  dateQuestion.setChoiceValues(availableDates);
  Logger.log(`Updated ${DATE_QUESTION_TITLE} with ${availableDates.length} options`);
}

// ==================== SETUP FUNCTIONS ====================

/**
 * Set up a time-driven trigger to run updateFormAvailability every 5 minutes
 * RUN THIS FUNCTION ONCE to set up automatic updates
 */
function setupTrigger() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateFormAvailability') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger - runs every 5 minutes
  ScriptApp.newTrigger('updateFormAvailability')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  Logger.log('Trigger set up successfully! Form will update every 5 minutes.');
  
  // Run once immediately
  updateFormAvailability();
}

/**
 * Remove the automatic trigger
 * Run this if you want to stop automatic updates
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateFormAvailability') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  Logger.log('Trigger removed. Automatic updates stopped.');
}

/**
 * Test function to check if everything is configured correctly
 */
function testConfiguration() {
  Logger.log('=== Configuration Test ===');
  
  try {
    // Test spreadsheet access
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log(`✓ Spreadsheet accessible: ${sheet.getName()}`);
    
    const dataSheet = sheet.getSheetByName(SHEET_NAME);
    if (dataSheet) {
      Logger.log(`✓ Sheet "${SHEET_NAME}" found`);
    } else {
      Logger.log(`✗ Sheet "${SHEET_NAME}" not found`);
    }
    
    // Test form access
    const form = FormApp.openById(FORM_ID);
    Logger.log(`✓ Form accessible: ${form.getTitle()}`);
    
    // List form questions
    Logger.log('\nForm questions:');
    const items = form.getItems();
    items.forEach((item, index) => {
      Logger.log(`  ${index + 1}. "${item.getTitle()}" (${item.getType()})`);
    });
    
    Logger.log('\n=== Test Complete ===');
  } catch (error) {
    Logger.log(`✗ Error: ${error.message}`);
  }
}
