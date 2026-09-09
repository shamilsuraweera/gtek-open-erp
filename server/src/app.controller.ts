import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: DatabaseService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('db-test')
  async testDb() {
    if (!this.db.isConnected()) {
      return { status: 'error', message: 'Database connection is not initialized. Check server logs.' };
    }

    try {
      return await this.db.ping();
    } catch (error) {
      return { status: 'error', message: 'Database query failed', details: error.message };
    }
  }
}
