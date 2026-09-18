import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { Invoice } from '../sales/invoice.entity';
import { VendorBill } from '../purchasing/vendor-bill.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JournalEntryLine, Invoice, VendorBill])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
