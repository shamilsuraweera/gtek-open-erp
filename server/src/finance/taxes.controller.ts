import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.taxesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taxesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaxDto) {
    return this.taxesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaxDto) {
    return this.taxesService.update(id, dto);
  }

  // Archive, never delete: this "deletes" by flipping IsActive to false.
  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.taxesService.archive(id);
  }
}
