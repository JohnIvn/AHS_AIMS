import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from '../../controllers/appointments.controller';
import { PrismaService } from '../../service/prisma/prisma.service';
import { EmailService } from '../../service/email/email.service';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            appoinment_details: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendAppointmentDecision: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
