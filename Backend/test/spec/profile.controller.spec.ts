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
});
