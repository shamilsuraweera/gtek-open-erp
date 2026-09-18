import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Get()
  findAll() {
    return this.journalEntriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.journalEntriesService.findOne(id);
  }

  @Post()
  createDraft(@Body() dto: CreateJournalEntryDto) {
    return this.journalEntriesService.createDraft(dto);
  }

  @Post(':id/post')
  postEntry(@Param('id', ParseIntPipe) id: number) {
    return this.journalEntriesService.postEntry(id);
  }
}
