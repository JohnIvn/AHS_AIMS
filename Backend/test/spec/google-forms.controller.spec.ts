import { Test, TestingModule } from '@nestjs/testing';
import { GoogleFormsController } from '../../controllers/google-forms.controller';
import { GoogleFormsService } from '../../service/google/google-forms.service';

describe('GoogleFormsController', () => {
  let controller: GoogleFormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleFormsController],
      providers: [
        {
          provide: GoogleFormsService,
          useValue: {
            getFormResponses: jest.fn(),
            getSheetNames: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GoogleFormsController>(GoogleFormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
