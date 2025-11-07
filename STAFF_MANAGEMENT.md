# Staff Management Feature

## Overview

The Staff Management feature allows admin users to manage staff accounts within the AHS AIMS system. This includes creating, viewing, editing, activating/deactivating, and deleting staff members.

## Access Control

- **Only admin accounts** can access the Staff Management page
- The "Staff" tab will only appear in the navigation menu for logged-in admin users
- All API endpoints are protected and require admin authentication

## Features

### 1. View All Staff Members

- Display all staff members in a sortable table
- Shows: Name, Email, Contact Number, Status, and Date Created
- Search functionality across name, email, and phone number
- Filter by status (All, Active, Inactive)

### 2. Add New Staff

- Create new staff accounts with:
  - First Name (required)
  - Last Name (required)
  - Email (required, must be unique)
  - Contact Number (optional, PH format: 09XXXXXXXXX)
  - Password (required, min 8 chars with letters and numbers)
- Sends welcome email notification to new staff member

### 3. View Staff Details

- Click "View" to see complete staff information
- Modal popup displays all staff details
- Option to edit from the view modal

### 4. Edit Staff Information

- Update staff details:
  - First Name and Last Name
  - Contact Number
  - Password (optional - only update if provided)
- Email cannot be changed (immutable)
- Sends notification email if password is changed

### 5. Toggle Staff Status

- Activate/Deactivate staff accounts
- Inactive accounts cannot sign in
- Sends status change notification email

### 6. Delete Staff

- Permanently remove staff accounts
- Confirmation dialog before deletion
- Sends deletion notification email

## Frontend Component

### Location

`Frontend/src/components/Admin/StaffManagement.jsx`

### Key Functions

- `fetchStaff()` - Retrieves all staff members
- `handleAddStaff()` - Opens modal to create new staff
- `handleEditStaff()` - Opens modal to edit existing staff
- `handleViewStaff()` - Opens modal to view staff details
- `handleToggleStatus()` - Activates/deactivates staff account
- `handleDeleteStaff()` - Deletes staff account with confirmation

## Backend Controller

### Location

`Backend/controllers/staff.controller.ts`

### API Endpoints

#### GET `/api/staff`

- **Description**: Get all staff members
- **Auth**: Admin only
- **Response**: Array of staff objects

#### GET `/api/staff/:id`

- **Description**: Get single staff member by ID
- **Auth**: Admin only
- **Response**: Staff object

#### POST `/api/staff`

- **Description**: Create new staff member
- **Auth**: Admin only
- **Body**:
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "contact_number": "string (optional)",
    "password": "string"
  }
  ```

#### PUT `/api/staff/:id`

- **Description**: Update staff member
- **Auth**: Admin only
- **Body**:
  ```json
  {
    "first_name": "string (optional)",
    "last_name": "string (optional)",
    "contact_number": "string (optional)",
    "password": "string (optional)"
  }
  ```

#### PATCH `/api/staff/:id/status`

- **Description**: Update staff status
- **Auth**: Admin only
- **Body**:
  ```json
  {
    "status": "active" | "inactive"
  }
  ```

#### DELETE `/api/staff/:id`

- **Description**: Delete staff member
- **Auth**: Admin only
- **Response**: Success message

## Email Notifications

The system sends email notifications for:

1. **Welcome Email** - When a new staff account is created
2. **Password Change** - When an admin updates a staff member's password
3. **Status Change** - When a staff account is activated/deactivated
4. **Account Deletion** - When a staff account is deleted

## Validation Rules

### Email

- Must be valid email format
- Must be unique across all staff accounts

### Contact Number

- Optional field
- If provided, must be in PH format: 09XXXXXXXXX (11 digits starting with 09)
- Must be unique if provided

### Password

- Minimum 8 characters
- Must include both letters and numbers
- Special characters allowed but not required

### Names

- First name and last name are required
- No specific format restrictions

## Database Schema

The feature uses the `staff_account` table:

```prisma
model staff_account {
  staff_id       String   @id @default(uuid())
  first_name     String
  last_name      String
  contact_number String?
  email          String   @unique
  password       String
  date_created   DateTime @default(now())
  status         String   @default("active")
}
```

## Security

- All endpoints require JWT authentication
- Admin role verification on every request
- Passwords are hashed using bcrypt (10 rounds)
- SQL injection protection via Prisma ORM
- Input validation on both frontend and backend

## UI/UX Features

- Responsive table design with horizontal scroll
- Modal dialogs for add/edit/view operations
- Real-time search filtering
- Status badge color coding
- Confirmation dialogs for destructive actions
- Loading states and error handling
- Success/error messages

## Future Enhancements

Potential improvements:

1. Bulk operations (activate/deactivate multiple staff)
2. Export staff list to CSV/Excel
3. Role-based permissions (different staff roles)
4. Activity logs (audit trail)
5. Password reset link generation
6. Staff profile pictures
7. Advanced filtering (date range, custom fields)
8. Pagination for large datasets

## Troubleshooting

### "Admin access required" error

- Ensure the logged-in user has `role: 'admin'` in their JWT token
- Check that the admin_account table is being used for authentication

### Email not being unique

- Verify the email doesn't exist in staff_account table
- Check for soft-deleted records if implementing soft delete

### Email notifications not sending

- Verify MAIL_USER and MAIL_PASS environment variables are set
- Check Gmail app password settings
- Review email service logs

## Testing

Test cases to cover:

1. Create staff with valid data
2. Create staff with duplicate email (should fail)
3. Create staff with invalid phone format (should fail)
4. Update staff information
5. Toggle staff status
6. Delete staff with confirmation
7. Search and filter functionality
8. Admin-only access restrictions
