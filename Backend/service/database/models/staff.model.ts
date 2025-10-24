import { Client } from 'pg';

export async function createStaffTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_admin (
      staff_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name text NOT NULL,
      last_name text NOT NULL,
      contact_number text,
      email text UNIQUE NOT NULL,
      password text NOT NULL,
      date_created timestamptz DEFAULT now(),
      status text CHECK (status IN ('active','inactive','banned')) DEFAULT 'active'
    );
  `);
}
