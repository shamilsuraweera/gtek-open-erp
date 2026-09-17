import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';

describe('ProductCategoriesController', () => {
  let controller: ProductCategoriesController;
  let service: jest.Mocked<ProductCategoriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCategoriesController],
      providers: [
        {
          provide: ProductCategoriesService,
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

    controller = module.get<ProductCategoriesController>(ProductCategoriesController);
    service = module.get(ProductCategoriesService);
  });

  it('findAll passes includeInactive through as a boolean', async () => {
    await controller.findAll('true');
    expect(service.findAll).toHaveBeenCalledWith(true);

    await controller.findAll(undefined);
    expect(service.findAll).toHaveBeenCalledWith(false);
  });

  it('create delegates to the service', async () => {
    const dto = { Name: 'Software' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('archive delegates to the service (soft delete)', async () => {
    await controller.archive(5);
    expect(service.archive).toHaveBeenCalledWith(5);
  });
});
