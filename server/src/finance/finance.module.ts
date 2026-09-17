import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Journal } from './entities/journal.entity';
import { Tax } from './entities/tax.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { JournalsService } from './journals.service';
import { JournalsController } from './journals.controller';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntriesController } from './journal-entries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Journal, Tax, JournalEntry, JournalEntryLine])],
  controllers: [AccountsController, JournalsController, TaxesController, JournalEntriesController],
  providers: [AccountsService, JournalsService, TaxesService, JournalEntriesService],
  exports: [AccountsService, JournalsService, TaxesService, JournalEntriesService],
})
export class FinanceModule {}
