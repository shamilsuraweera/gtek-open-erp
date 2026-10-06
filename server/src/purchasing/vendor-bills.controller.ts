import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VendorBillsService } from './vendor-bills.service';
import { CreateVendorBillDto } from './dto/create-vendor-bill.dto';

@UseGuards(JwtAuthGuard)
@Controller('purchasing/vendor-bills')
export class VendorBillsController {
  constructor(private readonly vendorBillsService: VendorBillsService) {}

  @Get()
  findAll() {
    return this.vendorBillsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorBillsService.findOne(id);
  }

  @Post()
  createDraft(@Body() dto: CreateVendorBillDto) {
    return this.vendorBillsService.createDraft(dto);
  }

  @Post(':id/post')
  postBill(@Param('id', ParseIntPipe) id: number) {
    return this.vendorBillsService.postBill(id);
  }
}
