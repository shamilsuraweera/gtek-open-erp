import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: jest.Mocked<ContactsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
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

    controller = module.get<ContactsController>(ContactsController);
    service = module.get(ContactsService);
  });

  it('findAll passes includeInactive through as a boolean', async () => {
    await controller.findAll('true');
    expect(service.findAll).toHaveBeenCalledWith(true);

    await controller.findAll(undefined);
    expect(service.findAll).toHaveBeenCalledWith(false);
  });

  it('create delegates to the service', async () => {
    const dto = { Name: 'Acme Corp' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('archive delegates to the service (soft delete)', async () => {
    await controller.archive(5);
    expect(service.archive).toHaveBeenCalledWith(5);
  });
});
