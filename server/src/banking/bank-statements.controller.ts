import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BankStatementsService } from './bank-statements.service';
import { CreateBankStatementDto } from './dto/create-bank-statement.dto';

@UseGuards(JwtAuthGuard)
@Controller('banking/bank-statements')
export class BankStatementsController {
  constructor(private readonly bankStatementsService: BankStatementsService) {}

  @Get()
  findAll() {
    return this.bankStatementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bankStatementsService.findOne(id);
  }

  @Post()
  createDraft(@Body() dto: CreateBankStatementDto) {
    return this.bankStatementsService.createDraft(dto);
  }
}
