import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const isWindowsAuth = configService.get<string>('DB_WINDOWS_AUTH') === 'true';

        return {
          type: 'mssql',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: parseInt(configService.get<string>('DB_PORT', '1433'), 10),
          database: configService.get<string>('DB_NAME'),
          ...(isWindowsAuth
            ? {
                extra: {
                  authentication: {
                    type: 'ntlm',
                    options: {
                      domain: configService.get<string>('DB_DOMAIN', ''),
                    },
                  },
                },
              }
            : {
                username: configService.get<string>('DB_USER'),
                password: configService.get<string>('DB_PASSWORD'),
              }),
          options: {
            encrypt: false,
            trustServerCertificate:
              configService.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
          },
          autoLoadEntities: true,
          // Existing Users table is the source of truth; TypeORM must never
          // auto-alter the schema. Use migrations for schema changes.
          synchronize: false,
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
