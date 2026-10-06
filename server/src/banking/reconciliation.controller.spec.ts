import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationController', () => {
  let controller: ReconciliationController;
  let service: jest.Mocked<ReconciliationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReconciliationController],
      providers: [
        {
          provide: ReconciliationService,
          useValue: {
            getUnreconciledBankLines: jest.fn(),
            getUnreconciledLedgerLines: jest.fn(),
            match: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReconciliationController>(ReconciliationController);
    service = module.get(ReconciliationService);
  });

  it('getUnreconciledBankLines delegates to the service with the parsed accountId', async () => {
    await controller.getUnreconciledBankLines(3);
    expect(service.getUnreconciledBankLines).toHaveBeenCalledWith(3);
  });

  it('getUnreconciledLedgerLines delegates to the service with the parsed accountId', async () => {
    await controller.getUnreconciledLedgerLines(3);
    expect(service.getUnreconciledLedgerLines).toHaveBeenCalledWith(3);
  });

  it('match delegates to the service with the DTO fields', async () => {
    await controller.match({ BankLineId: 1, JournalLineId: 2 });
    expect(service.match).toHaveBeenCalledWith(1, 2);
  });
});
