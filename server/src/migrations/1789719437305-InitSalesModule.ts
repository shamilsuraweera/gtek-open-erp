import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSalesModule1789719437305 implements MigrationInterface {
    name = 'InitSalesModule1789719437305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "InvoiceLines" ("Id" int NOT NULL IDENTITY(1,1), "Description" nvarchar(500) NOT NULL, "Quantity" decimal(19,4) NOT NULL CONSTRAINT "DF_d72b7ed459784f50e5b9bb00e06" DEFAULT 0, "UnitPrice" decimal(19,4) NOT NULL CONSTRAINT "DF_b9f22273c8a5f10bcc69abc62a5" DEFAULT 0, "LineTotal" decimal(19,4) NOT NULL CONSTRAINT "DF_29d02f98737c7e9a66aee269eee" DEFAULT 0, "InvoiceId" int NOT NULL, "ProductId" int NOT NULL, CONSTRAINT "PK_93d39be117e90bbfca4daa1506f" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Invoices" ("Id" int NOT NULL IDENTITY(1,1), "InvoiceNumber" varchar(50) NOT NULL, "Date" date NOT NULL, "DueDate" date NOT NULL, "Status" nvarchar(20) CONSTRAINT CHK_892ff05064e3e186d13755095d_ENUM CHECK(Status IN ('Draft','Posted','Cancelled')) NOT NULL CONSTRAINT "DF_4dfb027dfb3378a956446129e2b" DEFAULT 'Draft', "TotalAmount" decimal(19,4) NOT NULL CONSTRAINT "DF_77175a2139ae0e9434a701b79b6" DEFAULT 0, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_46d7b2ec5e1771d627944bcbf77" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_b54995542b8f16ad57fa05e7707" DEFAULT getdate(), "ContactId" int NOT NULL, CONSTRAINT "PK_c756ca9461dc6d8be9154f985f4" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "InvoiceLines" ADD CONSTRAINT "FK_055c6e7408d89b7f6d1a531bf07" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "InvoiceLines" ADD CONSTRAINT "FK_9346642bdeb1b840c58e9f92029" FOREIGN KEY ("ProductId") REFERENCES "Products"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoices" ADD CONSTRAINT "FK_a7a7634855f40175a6456862841" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // Filtered unique index (Draft support): unlimited blank-InvoiceNumber
        // drafts may coexist; uniqueness applies only once an invoice is
        // posted and gets a real number. Same pattern as
        // UQ_JournalEntries_Journal_Reference.
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_Invoices_InvoiceNumber" ON "Invoices" ("InvoiceNumber") WHERE "InvoiceNumber" <> ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_Invoices_InvoiceNumber" ON "Invoices"`);
        await queryRunner.query(`ALTER TABLE "Invoices" DROP CONSTRAINT "FK_a7a7634855f40175a6456862841"`);
        await queryRunner.query(`ALTER TABLE "InvoiceLines" DROP CONSTRAINT "FK_9346642bdeb1b840c58e9f92029"`);
        await queryRunner.query(`ALTER TABLE "InvoiceLines" DROP CONSTRAINT "FK_055c6e7408d89b7f6d1a531bf07"`);
        await queryRunner.query(`DROP TABLE "Invoices"`);
        await queryRunner.query(`DROP TABLE "InvoiceLines"`);
    }

}
