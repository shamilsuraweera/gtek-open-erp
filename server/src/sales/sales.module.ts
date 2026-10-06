import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceLine } from './invoice-line.entity';
import { Contact } from '../contacts/contact.entity';
import { Product } from '../inventory/product.entity';
import { FinanceModule } from '../finance/finance.module';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceLine, Contact, Product]),
    // Needed for JournalEntriesService — the posting engine InvoicesService
    // reuses (via its optional EntityManager parameter) so an invoice's
    // generated accounting entry shares this module's own transaction.
    FinanceModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class SalesModule {}
