import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { Invoice } from '../sales/invoice.entity';
import { VendorBill } from '../purchasing/vendor-bill.entity';
import { AccountType, JournalEntryState } from '../finance/finance.enums';
import { formatAggregate } from '../finance/utils/money';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';

interface RawTotalRow {
  total: number | string | null;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(JournalEntryLine)
    private readonly lineRepository: Repository<JournalEntryLine>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(VendorBill)
    private readonly vendorBillRepository: Repository<VendorBill>,
  ) {}

  /**
   * Three independent aggregate queries, each following the same pattern
   * as ReportsService.getTrialBalance: sum in SQL (never pull individual
   * line rows into the app to add them up in JS), CAST to DECIMAL(19,4)
   * for a well-defined wire format, then formatAggregate normalizes a
   * NULL (no matching rows at all) to "0.0000" rather than surfacing
   * null/NaN to the client.
   */
  async getMetrics(): Promise<DashboardMetricsDto> {
    const now = new Date();
    // UTC throughout, to avoid the server's local timezone shifting which
    // calendar month "today" falls in right at a month boundary.
    const startOfMonth = formatDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    const startOfNextMonth = formatDateOnly(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    );

    // Revenue this month: Income accounts are credit-normal, so
    // (Credit - Debit) is the net amount earned in the period.
    const revenueRow = await this.lineRepository
      .createQueryBuilder('line')
      .innerJoin('line.JournalEntry', 'entry')
      .innerJoin('line.Account', 'account')
      .select('CAST(SUM(line.Credit - line.Debit) AS DECIMAL(19,4))', 'total')
      .where('entry.State = :state', { state: JournalEntryState.Posted })
      .andWhere('account.Type = :type', { type: AccountType.Income })
      .andWhere('entry.EntryDate >= :start', { start: startOfMonth })
      .andWhere('entry.EntryDate < :end', { end: startOfNextMonth })
      .getRawOne<RawTotalRow>();

    // Unpaid AR: Asset-side receivable accounts are debit-normal, so
    // (Debit - Credit) is the outstanding balance owed to us. The account
    // set is "whichever Accounts any Contact currently designates as its
    // AccountsReceivableId" — a static, parameter-free subquery, safe to
    // inline directly rather than build via the QueryBuilder subQuery API.
    const arRow = await this.lineRepository
      .createQueryBuilder('line')
      .innerJoin('line.JournalEntry', 'entry')
      .innerJoin('line.Account', 'account')
      .select('CAST(SUM(line.Debit - line.Credit) AS DECIMAL(19,4))', 'total')
      .where('entry.State = :state', { state: JournalEntryState.Posted })
      .andWhere(
        `account.Id IN (SELECT DISTINCT "AccountsReceivableId" FROM "Contacts" WHERE "AccountsReceivableId" IS NOT NULL)`,
      )
      .getRawOne<RawTotalRow>();

    // Unpaid AP: Liability-side payable accounts are credit-normal, so
    // (Credit - Debit) is the outstanding balance we owe.
    const apRow = await this.lineRepository
      .createQueryBuilder('line')
      .innerJoin('line.JournalEntry', 'entry')
      .innerJoin('line.Account', 'account')
      .select('CAST(SUM(line.Credit - line.Debit) AS DECIMAL(19,4))', 'total')
      .where('entry.State = :state', { state: JournalEntryState.Posted })
      .andWhere(
        `account.Id IN (SELECT DISTINCT "AccountsPayableId" FROM "Contacts" WHERE "AccountsPayableId" IS NOT NULL)`,
      )
      .getRawOne<RawTotalRow>();

    return {
      revenueThisMonth: formatAggregate(revenueRow?.total),
      unpaidAR: formatAggregate(arRow?.total),
      unpaidAP: formatAggregate(apRow?.total),
    };
  }

  async getRecentActivity(): Promise<RecentActivityDto> {
    const recentInvoices = await this.invoiceRepository.find({
      relations: { Contact: true },
      order: { CreatedAt: 'DESC' },
      take: 5,
    });

    const recentVendorBills = await this.vendorBillRepository.find({
      relations: { Contact: true },
      order: { CreatedAt: 'DESC' },
      take: 5,
    });

    return { recentInvoices, recentVendorBills };
  }
}
