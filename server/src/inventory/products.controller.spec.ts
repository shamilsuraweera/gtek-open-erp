import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductType } from './inventory.enums';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
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

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('create delegates to the service', async () => {
    const dto = {
      Name: 'Widget',
      SKU: 'WID-1',
      Type: ProductType.Storable,
      CategoryId: 1,
      SalePrice: '19.99',
      CostPrice: '10',
    };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('archive delegates to the service (soft delete)', async () => {
    await controller.archive(7);
    expect(service.archive).toHaveBeenCalledWith(7);
  });
});
