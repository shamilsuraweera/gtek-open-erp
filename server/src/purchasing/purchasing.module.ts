import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorBill } from './vendor-bill.entity';
import { VendorBillLine } from './vendor-bill-line.entity';
import { Contact } from '../contacts/contact.entity';
import { Product } from '../inventory/product.entity';
import { FinanceModule } from '../finance/finance.module';
import { VendorBillsService } from './vendor-bills.service';
import { VendorBillsController } from './vendor-bills.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorBill, VendorBillLine, Contact, Product]),
    // Needed for JournalEntriesService — the posting engine
    // VendorBillsService reuses (via its optional EntityManager parameter)
    // so a bill's generated accounting entry shares this module's own
    // transaction. Mirrors SalesModule exactly.
    FinanceModule,
  ],
  controllers: [VendorBillsController],
  providers: [VendorBillsService],
  exports: [VendorBillsService],
})
export class PurchasingModule {}
