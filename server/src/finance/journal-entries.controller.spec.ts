import { Test, TestingModule } from '@nestjs/testing';
import { JournalEntriesController } from './journal-entries.controller';
import { JournalEntriesService } from './journal-entries.service';

describe('JournalEntriesController', () => {
  let controller: JournalEntriesController;
  let service: jest.Mocked<JournalEntriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JournalEntriesController],
      providers: [
        {
          provide: JournalEntriesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            createDraft: jest.fn(),
            postEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JournalEntriesController>(JournalEntriesController);
    service = module.get(JournalEntriesService);
  });

  it('createDraft delegates to the service', async () => {
    const dto = {
      JournalId: 1,
      EntryDate: '2026-09-16',
      Lines: [{ AccountId: 10, Debit: '100', Credit: '0' }],
    };
    await controller.createDraft(dto);
    expect(service.createDraft).toHaveBeenCalledWith(dto);
  });

  it('postEntry delegates to the service with the parsed id', async () => {
    await controller.postEntry(42);
    expect(service.postEntry).toHaveBeenCalledWith(42);
  });
});
