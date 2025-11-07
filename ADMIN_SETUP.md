# Creating Your First Admin Account

## Quick Setup Guide

You have **two options** to create an admin account:

---

## Option 1: Using the Database Script (Recommended)

### Step 1: Edit the Script

Open `Backend/scripts/create-admin.ts` and update these values:

```typescript
const adminData = {
  first_name: "Admin", // Your first name
  last_name: "User", // Your last name
  email: "admin@ahs-aims.com", // Your admin email
  password: "Admin123", // Your password (CHANGE THIS!)
  contact_number: "09123456789", // Optional phone number
};
```

### Step 2: Run the Script

In the `Backend` folder, run:

```bash
cd Backend
npx ts-node scripts/create-admin.ts
```

### Step 3: Sign In

Go to your app and sign in with:

- **Email**: The email you set in the script
- **Password**: The password you set in the script

---

## Option 2: Direct Database Insert

If you prefer, you can insert directly into your PostgreSQL database:

### Step 1: Hash Your Password

You need to hash the password first. Run this in Node.js:

```javascript
const bcrypt = require("bcrypt");
bcrypt.hash("YourPassword123", 10, (err, hash) => {
  console.log(hash);
});
```

### Step 2: Insert into Database

```sql
INSERT INTO admin_account (
  admin_id,
  first_name,
  last_name,
  email,
  password,
  contact_number,
  status,
  date_created
)
VALUES (
  gen_random_uuid(),           -- Generates UUID
  'Admin',                      -- Your first name
  'User',                       -- Your last name
  'admin@ahs-aims.com',        -- Your email
  '$2b$10$...',                -- Your hashed password from Step 1
  '09123456789',               -- Optional phone number
  'active',                     -- Account status
  NOW()                         -- Current timestamp
);
```

---

## What Changed?

The SignIn system now:

- ✅ Checks **both** `admin_account` and `staff_account` tables
- ✅ Assigns correct role (`admin` or `staff`) to the JWT token
- ✅ Returns the role in the user object
- ✅ Verifies account status (must be 'active')
- ✅ Admin users can access the Staff Management page

---

## Important Notes

⚠️ **Security Tips:**

1. Change the default password immediately after first login
2. Use a strong password (min 8 chars, letters + numbers)
3. Don't share admin credentials
4. Only create admin accounts for trusted users

🔐 **Password Requirements:**

- Minimum 8 characters
- Must contain letters AND numbers
- Special characters allowed but not required

---

## Testing Your Admin Account

### 1. Sign In

- Go to the sign-in page
- Enter your admin email and password
- Click "Sign In"

### 2. Verify Admin Access

After signing in, you should see:

- A **"Staff"** tab in the navigation menu (only visible to admins)
- Access to all other features (Appointments, Calendar, Stats, etc.)

### 3. Test Staff Management

- Click the **"Staff"** tab
- You should see the staff management page
- Try adding, editing, and managing staff accounts

---

## Troubleshooting

### "User not found"

- Make sure the admin account was created successfully
- Check the email is correct (case-sensitive)
- Verify the database connection

### "Account is inactive"

- The admin account status must be 'active'
- Update the status in the database if needed

### "Staff tab not showing"

- Check that the role is being returned correctly in the signin response
- Open browser dev tools → Network tab → Check the signin response
- The user object should include `"role": "admin"`

### Can't run the script

Make sure you have:

- `ts-node` installed: `npm install -g ts-node`
- Or use: `npx ts-node scripts/create-admin.ts`
- Database connection configured in `.env` file

---

## Next Steps

Once you have your admin account:

1. ✅ Sign in as admin
2. ✅ Change your password (via Profile page)
3. ✅ Create staff accounts via the Staff Management page
4. ✅ Configure system settings
5. ✅ Start managing appointments

---

## Multiple Admin Accounts

To create additional admin accounts:

**Option A:** Run the script again with different email
**Option B:** As an admin, you could create an "Admin Signup" page (future enhancement)
**Option C:** Use the Staff Management page and manually change `staff_account` records to `admin_account` table

---

## Database Schema Reference

### admin_account table structure:

```
admin_id       UUID      (Primary Key, Auto-generated)
first_name     String    (Required)
last_name      String    (Required)
contact_number String    (Optional)
email          String    (Required, Unique)
password       String    (Required, Hashed)
date_created   DateTime  (Auto-generated)
status         String    (Default: 'active')
```
