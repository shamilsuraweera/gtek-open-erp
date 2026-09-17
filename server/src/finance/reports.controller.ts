import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller('finance/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trial-balance')
  getTrialBalance() {
    return this.reportsService.getTrialBalance();
  }

  @Get('general-ledger')
  getGeneralLedger(@Query('accountId', ParseIntPipe) accountId: number) {
    return this.reportsService.getGeneralLedger(accountId);
  }
}
