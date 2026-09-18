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
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.journalsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.journalsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateJournalDto) {
    return this.journalsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJournalDto) {
    return this.journalsService.update(id, dto);
  }

  // Archive, never delete: this "deletes" by flipping IsActive to false.
  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.journalsService.archive(id);
  }
}
