import { Body, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReconciliationService } from './reconciliation.service';
import { MatchDto } from './dto/match.dto';

@UseGuards(JwtAuthGuard)
@Controller('banking/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('unreconciled-bank-lines')
  getUnreconciledBankLines(@Query('accountId', ParseIntPipe) accountId: number) {
    return this.reconciliationService.getUnreconciledBankLines(accountId);
  }

  @Get('unreconciled-ledger-lines')
  getUnreconciledLedgerLines(@Query('accountId', ParseIntPipe) accountId: number) {
    return this.reconciliationService.getUnreconciledLedgerLines(accountId);
  }

  @Post('match')
  match(@Body() dto: MatchDto) {
    return this.reconciliationService.match(dto.BankLineId, dto.JournalLineId);
  }
}
