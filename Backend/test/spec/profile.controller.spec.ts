import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../../controllers/profile.controller';
import { PrismaService } from '../../service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../service/email/email.service';

describe('ProfileController', () => {
  let controller: ProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            staff_account: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            admin_account: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
            verify: jest.fn().mockImplementation((token) => {
              if (token === 'adminToken')
                return { email: 'admin@example.com', role: 'admin' };
              if (token === 'staffToken')
                return { email: 'staff@example.com', role: 'staff' };
              return { email: 'unknown@example.com' };
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordChanged: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('fetches staff profile when role=staff', async () => {
    const prisma: any = (controller as any).prisma;
    prisma.staff_account.findUnique.mockResolvedValueOnce({
      staff_id: 's1',
      email: 'staff@example.com',
      first_name: 'Staff',
      last_name: 'User',
      contact_number: '09123456789',
      status: 'active',
      date_created: new Date(),
    });
    const res = await controller.getMe('Bearer staffToken');
    expect(res.success).toBe(true);
    expect((res as any).user.email).toBe('staff@example.com');
  });

  it('fetches admin profile when role=admin', async () => {
    const prisma: any = (controller as any).prisma;
    prisma.admin_account.findUnique.mockResolvedValueOnce({
      admin_id: 'a1',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      contact_number: '09998887777',
      status: 'active',
      date_created: new Date(),
    });
    const res = await controller.getMe('Bearer adminToken');
    expect(res.success).toBe(true);
    expect((res as any).user.email).toBe('admin@example.com');
  });
});
