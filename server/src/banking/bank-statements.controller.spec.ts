import { Test, TestingModule } from '@nestjs/testing';
import { BankStatementsController } from './bank-statements.controller';
import { BankStatementsService } from './bank-statements.service';

describe('BankStatementsController', () => {
  let controller: BankStatementsController;
  let service: jest.Mocked<BankStatementsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankStatementsController],
      providers: [
        {
          provide: BankStatementsService,
          useValue: { findAll: jest.fn(), findOne: jest.fn(), createDraft: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<BankStatementsController>(BankStatementsController);
    service = module.get(BankStatementsService);
  });

  it('createDraft delegates to the service', async () => {
    const dto = {
      AccountId: 1,
      StatementDate: '2026-02-01',
      Reference: 'STMT-FEB',
      StartingBalance: '1000',
      Lines: [{ Date: '2026-02-02', Description: 'Deposit', Amount: '100' }],
    };
    await controller.createDraft(dto);
    expect(service.createDraft).toHaveBeenCalledWith(dto);
  });

  it('findOne delegates to the service with the parsed id', async () => {
    await controller.findOne(5);
    expect(service.findOne).toHaveBeenCalledWith(5);
  });
});
