import { Test, TestingModule } from '@nestjs/testing';
import { SignInController } from '../../controllers/signin.controller';
import { PrismaService } from '../../service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('SignInController', () => {
  let controller: SignInController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignInController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            staff_account: {
              findUnique: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<SignInController>(SignInController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
