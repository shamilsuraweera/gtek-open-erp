import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { JournalEntryLine } from '../finance/entities/journal-entry-line.entity';
import { Invoice } from '../sales/invoice.entity';
import { VendorBill } from '../purchasing/vendor-bill.entity';
import { JournalEntryState } from '../finance/finance.enums';

function createQueryBuilderMock(rawOneResult: unknown) {
  const qb: any = {};
  ['innerJoin', 'select', 'where', 'andWhere'].forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });
  qb.getRawOne = jest.fn().mockResolvedValue(rawOneResult);
  return qb;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let lineRepository: jest.Mocked<Repository<JournalEntryLine>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let vendorBillRepository: jest.Mocked<Repository<VendorBill>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(JournalEntryLine),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(VendorBill),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    lineRepository = module.get(getRepositoryToken(JournalEntryLine));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    vendorBillRepository = module.get(getRepositoryToken(VendorBill));
  });

  describe('getMetrics', () => {
    it('formats each aggregate to a canonical 4-decimal string', async () => {
      const revenueQb = createQueryBuilderMock({ total: 15200.5 });
      const arQb = createQueryBuilderMock({ total: 3200 });
      const apQb = createQueryBuilderMock({ total: 980.25 });
      lineRepository.createQueryBuilder
        .mockReturnValueOnce(revenueQb)
        .mockReturnValueOnce(arQb)
        .mockReturnValueOnce(apQb);

      const result = await service.getMetrics();

      expect(result).toEqual({
        revenueThisMonth: '15200.5000',
        unpaidAR: '3200.0000',
        unpaidAP: '980.2500',
      });
    });

    it('filters revenue by Posted state and Income account type', async () => {
      const revenueQb = createQueryBuilderMock({ total: 0 });
      const arQb = createQueryBuilderMock({ total: 0 });
      const apQb = createQueryBuilderMock({ total: 0 });
      lineRepository.createQueryBuilder
        .mockReturnValueOnce(revenueQb)
        .mockReturnValueOnce(arQb)
        .mockReturnValueOnce(apQb);

      await service.getMetrics();

      expect(revenueQb.where).toHaveBeenCalledWith('entry.State = :state', {
        state: JournalEntryState.Posted,
      });
      expect(revenueQb.andWhere).toHaveBeenCalledWith('account.Type = :type', { type: 'Income' });
    });

    it('gracefully returns "0.0000" when a metric has no matching rows (NULL sum)', async () => {
      const revenueQb = createQueryBuilderMock({ total: null });
      const arQb = createQueryBuilderMock(undefined);
      const apQb = createQueryBuilderMock({ total: null });
      lineRepository.createQueryBuilder
        .mockReturnValueOnce(revenueQb)
        .mockReturnValueOnce(arQb)
        .mockReturnValueOnce(apQb);

      const result = await service.getMetrics();

      expect(result).toEqual({
        revenueThisMonth: '0.0000',
        unpaidAR: '0.0000',
        unpaidAP: '0.0000',
      });
    });
  });

  describe('getRecentActivity', () => {
    it('fetches the 5 most recently created invoices and vendor bills, eager-loading Contact', async () => {
      invoiceRepository.find.mockResolvedValue([{ Id: 1 } as Invoice]);
      vendorBillRepository.find.mockResolvedValue([{ Id: 2 } as VendorBill]);

      const result = await service.getRecentActivity();

      expect(invoiceRepository.find).toHaveBeenCalledWith({
        relations: { Contact: true },
        order: { CreatedAt: 'DESC' },
        take: 5,
      });
      expect(vendorBillRepository.find).toHaveBeenCalledWith({
        relations: { Contact: true },
        order: { CreatedAt: 'DESC' },
        take: 5,
      });
      expect(result).toEqual({
        recentInvoices: [{ Id: 1 }],
        recentVendorBills: [{ Id: 2 }],
      });
    });
  });
});
