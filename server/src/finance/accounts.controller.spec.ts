import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountType } from './finance.enums';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: jest.Mocked<AccountsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
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

    controller = module.get<AccountsController>(AccountsController);
    service = module.get(AccountsService);
  });

  it('findAll passes includeInactive through as a boolean', async () => {
    await controller.findAll('true');
    expect(service.findAll).toHaveBeenCalledWith(true);

    await controller.findAll(undefined);
    expect(service.findAll).toHaveBeenCalledWith(false);
  });

  it('create delegates to the service', async () => {
    const dto = { Code: '1000', Name: 'Cash', Type: AccountType.Asset };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('archive delegates to the service (soft delete)', async () => {
    await controller.archive(5);
    expect(service.archive).toHaveBeenCalledWith(5);
  });
});
