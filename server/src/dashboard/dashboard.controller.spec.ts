import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: { getMetrics: jest.fn(), getRecentActivity: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService);
  });

  it('getMetrics delegates to the service', async () => {
    await controller.getMetrics();
    expect(service.getMetrics).toHaveBeenCalled();
  });

  it('getRecentActivity delegates to the service', async () => {
    await controller.getRecentActivity();
    expect(service.getRecentActivity).toHaveBeenCalled();
  });
});
