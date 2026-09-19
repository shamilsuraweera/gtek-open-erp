import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: { getTrialBalance: jest.fn(), getGeneralLedger: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get(ReportsService);
  });

  it('getTrialBalance delegates to the service', async () => {
    await controller.getTrialBalance();
    expect(service.getTrialBalance).toHaveBeenCalled();
  });

  it('getGeneralLedger delegates to the service with the parsed accountId', async () => {
    await controller.getGeneralLedger(7);
    expect(service.getGeneralLedger).toHaveBeenCalledWith(7);
  });
});
