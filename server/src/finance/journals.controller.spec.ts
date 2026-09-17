import { Test, TestingModule } from '@nestjs/testing';
import { JournalsController } from './journals.controller';
import { JournalsService } from './journals.service';
import { JournalType } from './finance.enums';

describe('JournalsController', () => {
  let controller: JournalsController;
  let service: jest.Mocked<JournalsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JournalsController],
      providers: [
        {
          provide: JournalsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            archive: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JournalsController>(JournalsController);
    service = module.get(JournalsService);
  });

  it('create delegates to the service', async () => {
    const dto = { Code: 'SAL', Name: 'Sales', Type: JournalType.Sales };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('archive delegates to the service (soft delete)', async () => {
    await controller.archive(3);
    expect(service.archive).toHaveBeenCalledWith(3);
  });
});
