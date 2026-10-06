import { Invoice } from '../../sales/invoice.entity';
import { VendorBill } from '../../purchasing/vendor-bill.entity';

export interface RecentActivityDto {
  recentInvoices: Invoice[];
  recentVendorBills: VendorBill[];
}
