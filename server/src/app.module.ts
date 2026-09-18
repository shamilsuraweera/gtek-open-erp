import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { ContactsModule } from './contacts/contacts.module';
import { SalesModule } from './sales/sales.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { BankingModule } from './banking/banking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    DatabaseModule,
    FinanceModule,
    InventoryModule,
    ContactsModule,
    SalesModule,
    PurchasingModule,
    BankingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
