import { Test, TestingModule } from '@nestjs/testing';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';
import { TaxAmountType, TaxScope } from './finance.enums';

describe('TaxesController', () => {
  let controller: TaxesController;
  let service: jest.Mocked<TaxesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxesController],
      providers: [
        {
          provide: TaxesService,
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

    controller = module.get<TaxesController>(TaxesController);
    service = module.get(TaxesService);
  });

  it('create delegates to the service', async () => {
    const dto = {
      Name: 'VAT 15%',
      Code: 'VAT15',
      AmountType: TaxAmountType.Percentage,
      Amount: '15',
      Scope: TaxScope.Sales,
      TaxAccountId: 9,
    };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('archive delegates to the service (soft delete)', async () => {
    await controller.archive(7);
    expect(service.archive).toHaveBeenCalledWith(7);
  });
});
