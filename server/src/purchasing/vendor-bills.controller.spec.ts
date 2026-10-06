import { Test, TestingModule } from '@nestjs/testing';
import { VendorBillsController } from './vendor-bills.controller';
import { VendorBillsService } from './vendor-bills.service';

describe('VendorBillsController', () => {
  let controller: VendorBillsController;
  let service: jest.Mocked<VendorBillsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorBillsController],
      providers: [
        {
          provide: VendorBillsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            createDraft: jest.fn(),
            postBill: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VendorBillsController>(VendorBillsController);
    service = module.get(VendorBillsService);
  });

  it('createDraft delegates to the service', async () => {
    const dto = {
      ContactId: 1,
      Date: '2026-01-01',
      DueDate: '2026-01-31',
      Lines: [{ ProductId: 5, Quantity: '1', UnitPrice: '10' }],
    };
    await controller.createDraft(dto);
    expect(service.createDraft).toHaveBeenCalledWith(dto);
  });

  it('postBill delegates to the service with the parsed id', async () => {
    await controller.postBill(7);
    expect(service.postBill).toHaveBeenCalledWith(7);
  });
});
