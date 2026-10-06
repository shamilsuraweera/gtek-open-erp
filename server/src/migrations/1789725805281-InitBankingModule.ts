import { MigrationInterface, QueryRunner } from "typeorm";

export class InitBankingModule1789725805281 implements MigrationInterface {
    name = 'InitBankingModule1789725805281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "BankStatementLines" ("Id" int NOT NULL IDENTITY(1,1), "Date" date NOT NULL, "Description" nvarchar(500) NOT NULL, "Amount" decimal(19,4) NOT NULL CONSTRAINT "DF_1cdd0fef4f172b27e66e51e7acd" DEFAULT 0, "IsReconciled" bit NOT NULL CONSTRAINT "DF_20fe227bf6cc99699629ca9abcd" DEFAULT 0, "BankStatementId" int NOT NULL, "MatchedJournalEntryLineId" int, CONSTRAINT "PK_871827b03b4d90d6e554d2b3f59" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "BankStatements" ("Id" int NOT NULL IDENTITY(1,1), "StatementDate" date NOT NULL, "Reference" varchar(100) NOT NULL, "StartingBalance" decimal(19,4) NOT NULL CONSTRAINT "DF_3eaedde3042d888cdee2eace17b" DEFAULT 0, "EndingBalance" decimal(19,4) NOT NULL CONSTRAINT "DF_d4557258a9e9c9e2c8926f63c5a" DEFAULT 0, "Status" nvarchar(20) CONSTRAINT CHK_1ac83393584802d976a36b2990_ENUM CHECK(Status IN ('Draft','Reconciled')) NOT NULL CONSTRAINT "DF_1cafe2a2471c66e1be263ecd38e" DEFAULT 'Draft', "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_a7646762eeb899bcd5d024c1ff7" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_649f17ed9645badd68468fb5f8d" DEFAULT getdate(), "AccountId" int NOT NULL, CONSTRAINT "PK_41f3d66e76b094467900fd4988d" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "BankStatementLines" ADD CONSTRAINT "FK_c57fc1a315b11281635b9680feb" FOREIGN KEY ("BankStatementId") REFERENCES "BankStatements"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "BankStatementLines" ADD CONSTRAINT "FK_09befa595d0de4c4327b2c103bd" FOREIGN KEY ("MatchedJournalEntryLineId") REFERENCES "JournalEntryLines"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "BankStatements" ADD CONSTRAINT "FK_4c23660805cee2be25807dc46e0" FOREIGN KEY ("AccountId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "BankStatements" DROP CONSTRAINT "FK_4c23660805cee2be25807dc46e0"`);
        await queryRunner.query(`ALTER TABLE "BankStatementLines" DROP CONSTRAINT "FK_09befa595d0de4c4327b2c103bd"`);
        await queryRunner.query(`ALTER TABLE "BankStatementLines" DROP CONSTRAINT "FK_c57fc1a315b11281635b9680feb"`);
        await queryRunner.query(`DROP TABLE "BankStatements"`);
        await queryRunner.query(`DROP TABLE "BankStatementLines"`);
    }

}
