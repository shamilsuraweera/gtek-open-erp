import { MigrationInterface, QueryRunner } from "typeorm";

export class InitFinanceModule1789577527238 implements MigrationInterface {
    name = 'InitFinanceModule1789577527238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Accounts" ("Id" int NOT NULL IDENTITY(1,1), "Code" varchar(20) NOT NULL, "Name" nvarchar(200) NOT NULL, "Type" nvarchar(20) CONSTRAINT CHK_ad05a19f85b2cff112cdd6b0b5_ENUM CHECK(Type IN ('Asset','Liability','Equity','Income','Expense')) NOT NULL, "IsActive" bit NOT NULL CONSTRAINT "DF_cbad7fefe7215bf300ad8dd5533" DEFAULT 1, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_f43a62421d7959dfdf9105cae62" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_e3a632fffef3aca55ad5252876f" DEFAULT getdate(), "ParentId" int, CONSTRAINT "UQ_d492574e480bc1eb8be2ab98225" UNIQUE ("Code"), CONSTRAINT "PK_b00432274d4ff6167f757799b1a" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Taxes" ("Id" int NOT NULL IDENTITY(1,1), "Name" nvarchar(100) NOT NULL, "Code" varchar(20) NOT NULL, "AmountType" nvarchar(20) CONSTRAINT CHK_4a61fbd5ec694f932d882fe3b5_ENUM CHECK(AmountType IN ('Percentage','Fixed')) NOT NULL, "Amount" decimal(19,4) NOT NULL, "Scope" nvarchar(20) CONSTRAINT CHK_7442915be9de40b73479c687d1_ENUM CHECK(Scope IN ('Sales','Purchase')) NOT NULL, "IsPriceIncluded" bit NOT NULL CONSTRAINT "DF_37f5c912d277b4b8850895ad512" DEFAULT 0, "IsActive" bit NOT NULL CONSTRAINT "DF_db7a5bc15d0cb4443a4cf64ef3d" DEFAULT 1, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_bb7a482dcc7f3f06f437d07f48a" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_a3eb4c3166129beb63a09f28718" DEFAULT getdate(), "TaxAccountId" int NOT NULL, CONSTRAINT "UQ_326fb4944b2a85303b585777c31" UNIQUE ("Code"), CONSTRAINT "PK_9a3c5f6afe1237d8d3dc0187891" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Journals" ("Id" int NOT NULL IDENTITY(1,1), "Code" varchar(10) NOT NULL, "Name" nvarchar(100) NOT NULL, "Type" nvarchar(20) CONSTRAINT CHK_68babd7a0780d7081220105bac_ENUM CHECK(Type IN ('Sales','Purchase','Bank','Cash','General')) NOT NULL, "SequencePrefix" varchar(20) NOT NULL CONSTRAINT "DF_96957924a9056f7c459f41ca7a9" DEFAULT '', "NextSequenceNumber" int NOT NULL CONSTRAINT "DF_3db88bbda5e87ae87ff07f278f6" DEFAULT 1, "IsActive" bit NOT NULL CONSTRAINT "DF_2012da5b5860451fa85669bcac5" DEFAULT 1, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_9b5d845150eb52ca752782c480c" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_8a5f3f7119b2f2ac336f7cf9b43" DEFAULT getdate(), "DefaultAccountId" int, CONSTRAINT "UQ_86dbfcf98795c62ca4705d6279d" UNIQUE ("Code"), CONSTRAINT "PK_792fea631a64b8db3490cf8c4bc" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "JournalEntryLines" ("Id" int NOT NULL IDENTITY(1,1), "LineNumber" int NOT NULL, "Description" nvarchar(500), "Debit" decimal(19,4) NOT NULL CONSTRAINT "DF_265a04093f126b1571bc31dd749" DEFAULT 0, "Credit" decimal(19,4) NOT NULL CONSTRAINT "DF_2498b75fb07cac68d206f6b559d" DEFAULT 0, "JournalEntryId" int NOT NULL, "AccountId" int NOT NULL, "TaxId" int, CONSTRAINT "PK_fb0a80c3f7d7ba745b75e04846f" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "JournalEntries" ("Id" int NOT NULL IDENTITY(1,1), "Reference" varchar(50) NOT NULL, "EntryDate" date NOT NULL, "State" nvarchar(20) CONSTRAINT CHK_88227ff2107d25c2addb7eedfa_ENUM CHECK(State IN ('Draft','Posted','Cancelled')) NOT NULL CONSTRAINT "DF_c66244334b2ed0dd393a5372317" DEFAULT 'Draft', "Narration" nvarchar(500), "TotalDebit" decimal(19,4) NOT NULL CONSTRAINT "DF_df779b3d1ce776e54cf37f808da" DEFAULT 0, "TotalCredit" decimal(19,4) NOT NULL CONSTRAINT "DF_1f2ebf2261b09435da0eb6e27c7" DEFAULT 0, "PostedAt" datetime2, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_3cbe0217d2d744516a15d21efb6" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_aacd17ba1dcd581287e6b3e6064" DEFAULT getdate(), "JournalId" int NOT NULL, "ReversalOfId" int, CONSTRAINT "PK_7ffa69f5b2a5b9e4599457488b6" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" ADD CONSTRAINT "CHK_JournalEntryLines_NonNegative" CHECK ("Debit" >= 0 AND "Credit" >= 0)`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" ADD CONSTRAINT "CHK_JournalEntryLines_OneSided" CHECK ("Debit" = 0 OR "Credit" = 0)`);
        await queryRunner.query(`ALTER TABLE "JournalEntries" ADD CONSTRAINT "CHK_JournalEntries_PostedTotalsBalance" CHECK ("State" <> 'Posted' OR "TotalDebit" = "TotalCredit")`);
        await queryRunner.query(`ALTER TABLE "Accounts" ADD CONSTRAINT "FK_aac060c0c51ccc2ef9486cfca39" FOREIGN KEY ("ParentId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Taxes" ADD CONSTRAINT "FK_88068e8e6ab0bec9450969a73de" FOREIGN KEY ("TaxAccountId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Journals" ADD CONSTRAINT "FK_e641363780e7dd5a0b1f15150dc" FOREIGN KEY ("DefaultAccountId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" ADD CONSTRAINT "FK_b660fc55fea8a2a0453ff77acef" FOREIGN KEY ("JournalEntryId") REFERENCES "JournalEntries"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" ADD CONSTRAINT "FK_0672c77615c053ab94347075ff7" FOREIGN KEY ("AccountId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" ADD CONSTRAINT "FK_884b9fdd4cd192c72c5a43da40c" FOREIGN KEY ("TaxId") REFERENCES "Taxes"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "JournalEntries" ADD CONSTRAINT "FK_26d6b7675303267dbc719244821" FOREIGN KEY ("JournalId") REFERENCES "Journals"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "JournalEntries" ADD CONSTRAINT "FK_ba7825e28a13b9a1b16f5eeefa3" FOREIGN KEY ("ReversalOfId") REFERENCES "JournalEntries"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "JournalEntries" DROP CONSTRAINT "FK_ba7825e28a13b9a1b16f5eeefa3"`);
        await queryRunner.query(`ALTER TABLE "JournalEntries" DROP CONSTRAINT "FK_26d6b7675303267dbc719244821"`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" DROP CONSTRAINT "FK_884b9fdd4cd192c72c5a43da40c"`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" DROP CONSTRAINT "FK_0672c77615c053ab94347075ff7"`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" DROP CONSTRAINT "FK_b660fc55fea8a2a0453ff77acef"`);
        await queryRunner.query(`ALTER TABLE "Journals" DROP CONSTRAINT "FK_e641363780e7dd5a0b1f15150dc"`);
        await queryRunner.query(`ALTER TABLE "Taxes" DROP CONSTRAINT "FK_88068e8e6ab0bec9450969a73de"`);
        await queryRunner.query(`ALTER TABLE "Accounts" DROP CONSTRAINT "FK_aac060c0c51ccc2ef9486cfca39"`);
        await queryRunner.query(`ALTER TABLE "JournalEntries" DROP CONSTRAINT "CHK_JournalEntries_PostedTotalsBalance"`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" DROP CONSTRAINT "CHK_JournalEntryLines_OneSided"`);
        await queryRunner.query(`ALTER TABLE "JournalEntryLines" DROP CONSTRAINT "CHK_JournalEntryLines_NonNegative"`);
        await queryRunner.query(`DROP TABLE "JournalEntries"`);
        await queryRunner.query(`DROP TABLE "JournalEntryLines"`);
        await queryRunner.query(`DROP TABLE "Journals"`);
        await queryRunner.query(`DROP TABLE "Taxes"`);
        await queryRunner.query(`DROP TABLE "Accounts"`);
    }

}
