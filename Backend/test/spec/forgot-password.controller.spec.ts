import { Test, TestingModule } from '@nestjs/testing';
import { ForgotPasswordController } from '../../controllers/forgot-password.controller';
import { PrismaService } from '../../service/prisma/prisma.service';
import { EmailService } from '../../service/email/email.service';

describe('ForgotPasswordController', () => {
  let controller: ForgotPasswordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForgotPasswordController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            staff_account: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            verification_code: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordReset: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ForgotPasswordController>(ForgotPasswordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
