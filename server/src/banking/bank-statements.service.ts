import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankStatement } from './bank-statement.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { Account } from '../finance/entities/account.entity';
import { CreateBankStatementDto } from './dto/create-bank-statement.dto';
import { fromMinorUnits, toMinorUnits } from '../finance/utils/money';

@Injectable()
export class BankStatementsService {
  constructor(
    @InjectRepository(BankStatement)
    private readonly bankStatementRepository: Repository<BankStatement>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async findAll(): Promise<BankStatement[]> {
    return this.bankStatementRepository.find({
      relations: { Account: true, Lines: true },
      order: { Id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BankStatement> {
    const statement = await this.bankStatementRepository.findOne({
      where: { Id: id },
      relations: { Account: true, Lines: true },
    });
    if (!statement) {
      throw new NotFoundException(`Bank statement ${id} not found`);
    }
    return statement;
  }

  /**
   * EndingBalance = StartingBalance + sum(line.Amount), computed entirely
   * via integer minor-unit arithmetic — never parseFloat/+/- on the raw
   * decimal strings, same rule as every other money computation in the app.
   */
  async createDraft(dto: CreateBankStatementDto): Promise<BankStatement> {
    const account = await this.accountRepository.findOneBy({ Id: dto.AccountId });
    if (!account || !account.IsActive) {
      throw new BadRequestException('Account not found or inactive');
    }

    const startingBalanceMinor = toMinorUnits(dto.StartingBalance);
    let endingBalanceMinor = startingBalanceMinor;

    const lines = dto.Lines.map((line) => {
      const amountMinor = toMinorUnits(line.Amount);
      if (amountMinor === 0) {
        throw new BadRequestException('A bank statement line amount cannot be zero');
      }
      endingBalanceMinor += amountMinor;

      const statementLine = new BankStatementLine();
      statementLine.Date = line.Date;
      statementLine.Description = line.Description;
      statementLine.Amount = fromMinorUnits(amountMinor);
      return statementLine;
    });

    const statement = this.bankStatementRepository.create({
      StatementDate: dto.StatementDate,
      Reference: dto.Reference,
      Account: account,
      StartingBalance: fromMinorUnits(startingBalanceMinor),
      EndingBalance: fromMinorUnits(endingBalanceMinor),
      Lines: lines,
    });

    return this.bankStatementRepository.save(statement);
  }
}
