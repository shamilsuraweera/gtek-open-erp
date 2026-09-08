import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  public pool: sql.ConnectionPool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dbConfig: sql.config = {
      server: this.configService.get<string>('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get<string>('DB_PORT', '1433'), 10),
      database: this.configService.get<string>('DB_NAME'),
      options: {
        encrypt: false,
        trustServerCertificate:
          this.configService.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
      },
    };

    // Use Windows Authentication when DB_WINDOWS_AUTH=true
    if (this.configService.get<string>('DB_WINDOWS_AUTH') === 'true') {
      (dbConfig as any).authentication = {
        type: 'ntlm',
        options: {
          domain: this.configService.get<string>('DB_DOMAIN', ''),
        },
      };
    } else {
      dbConfig.user = this.configService.get<string>('DB_USER');
      dbConfig.password = this.configService.get<string>('DB_PASSWORD');
    }

    try {
      this.pool = await sql.connect(dbConfig);
      this.logger.log('Connected to SQL Server');
    } catch (error) {
      this.logger.error('Failed to connect to SQL Server. Ensure SQL Server is running.', error.message);
      // We do not throw the error here so the NestJS server can still start
      // and serve the health check endpoints.
    }
  }
}
