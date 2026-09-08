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
    if (!this.db.pool) {
      return { status: 'error', message: 'Database connection pool is not initialized. Check server logs.' };
    }
    
    try {
      const result = await this.db.pool.request().query('SELECT 1 AS test');
      return result.recordset;
    } catch (error) {
      return { status: 'error', message: 'Database query failed', details: error.message };
    }
  }
}
