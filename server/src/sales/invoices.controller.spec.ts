import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: jest.Mocked<InvoicesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            createDraft: jest.fn(),
            postInvoice: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get(InvoicesService);
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

  it('postInvoice delegates to the service with the parsed id', async () => {
    await controller.postInvoice(7);
    expect(service.postInvoice).toHaveBeenCalledWith(7);
  });
});
