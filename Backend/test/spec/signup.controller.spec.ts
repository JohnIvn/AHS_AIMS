import { Test, TestingModule } from '@nestjs/testing';
import { SignUpStaffController } from '../../controllers/signup.controller';
import { PrismaService } from '../../service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../../service/email/email.service';

describe('SignUpStaffController', () => {
  let controller: SignUpStaffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignUpStaffController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            staff_account: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            verification_code: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token'),
            verify: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SignUpStaffController>(SignUpStaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
