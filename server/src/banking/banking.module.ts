import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankStatement } from './bank-statement.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { Account } from '../finance/entities/account.entity';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { BankStatementsService } from './bank-statements.service';
import { BankStatementsController } from './bank-statements.controller';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BankStatement, BankStatementLine, Account, JournalEntryLine])],
  controllers: [BankStatementsController, ReconciliationController],
  providers: [BankStatementsService, ReconciliationService],
  exports: [BankStatementsService, ReconciliationService],
})
export class BankingModule {}
