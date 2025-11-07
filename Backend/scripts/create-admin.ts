import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminData = {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@ahs-aims.com',
      password: 'Admin123', 
      contact_number: '09123456789',
    };

    console.log('Creating admin account...');
    console.log('Email:', adminData.email);

    const existingAdmin = await prisma.admin_account.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log('Admin account with this email already exists!');
      console.log('Admin ID:', existingAdmin.admin_id);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = await prisma.admin_account.create({
      data: {
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        email: adminData.email,
        password: hashedPassword,
        contact_number: adminData.contact_number,
        status: 'active',
      },
    });

    console.log('Admin account created successfully!');
    console.log('Admin ID:', admin.admin_id);
    console.log('Name:', admin.first_name, admin.last_name);
    console.log('Email:', admin.email);
    console.log('\nIMPORTANT: Save these credentials securely!');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('\nPlease change the password after first login!');
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
