import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  isConnected(): boolean {
    return this.dataSource.isInitialized;
  }

  async ping(): Promise<unknown> {
    return this.dataSource.query('SELECT 1 AS test');
  }
}
