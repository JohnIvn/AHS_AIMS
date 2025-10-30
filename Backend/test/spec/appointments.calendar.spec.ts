import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from '../../controllers/appointments.controller';
import { PrismaService } from '../../service/prisma/prisma.service';
import { EmailService } from '../../service/email/email.service';

describe('AppointmentsController - calendar', () => {
  let controller: AppointmentsController;
  const prismaMock = {
    appoinment_details: {
      findMany: jest.fn(),
    },
  } as any;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-10-30T10:00:00Z'));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: EmailService,
          useValue: { sendAppointmentDecision: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('returns events mapped for FullCalendar', async () => {
    prismaMock.appoinment_details.findMany.mockResolvedValueOnce([
      {
        user_id: 'u1',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        contact_number: '123',
        reason: 'Consult',
        status: 'accepted',
        date_created: new Date('2025-10-28T00:00:00Z'),
      },
    ]);

    const res = await controller.getCalendar('2025-10-01', '2025-10-31');

    expect(res.events).toHaveLength(1);
    expect(res.events[0]).toMatchObject({
      id: 'u1',
      title: 'Jane Doe',
      allDay: true,
      extendedProps: expect.objectContaining({
        email: 'jane@example.com',
        status: 'accepted',
      }),
    });
  });
});
