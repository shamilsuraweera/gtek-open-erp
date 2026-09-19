import { MigrationInterface, QueryRunner } from "typeorm";

export class InitPurchasingModule1789722551177 implements MigrationInterface {
    name = 'InitPurchasingModule1789722551177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "VendorBillLines" ("Id" int NOT NULL IDENTITY(1,1), "Description" nvarchar(500) NOT NULL, "Quantity" decimal(19,4) NOT NULL CONSTRAINT "DF_b308bf49aabcd42d4b09f01b9f6" DEFAULT 0, "UnitPrice" decimal(19,4) NOT NULL CONSTRAINT "DF_6d2e657af633dcbfd37bea4d4e8" DEFAULT 0, "LineTotal" decimal(19,4) NOT NULL CONSTRAINT "DF_1cd2f4d2e9dc62f6fe082c30513" DEFAULT 0, "VendorBillId" int NOT NULL, "ProductId" int NOT NULL, CONSTRAINT "PK_c2240f80c081df36ef57053b7b7" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "VendorBills" ("Id" int NOT NULL IDENTITY(1,1), "BillNumber" varchar(50) NOT NULL, "Date" date NOT NULL, "DueDate" date NOT NULL, "Status" nvarchar(20) CONSTRAINT CHK_bdef55d674d1d8f431c44fe4c9_ENUM CHECK(Status IN ('Draft','Posted','Cancelled')) NOT NULL CONSTRAINT "DF_cb20be8b3a0e675faef7d7e7b19" DEFAULT 'Draft', "TotalAmount" decimal(19,4) NOT NULL CONSTRAINT "DF_8fe16cd5d535911cb7df2ee8ed1" DEFAULT 0, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_0db823528fd11e91fe375bd00a1" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_7f701dd461803fd68498fc557bc" DEFAULT getdate(), "ContactId" int NOT NULL, CONSTRAINT "PK_bf6750665e84ffd201143523166" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "VendorBillLines" ADD CONSTRAINT "FK_835205dd835c99c8d9119384073" FOREIGN KEY ("VendorBillId") REFERENCES "VendorBills"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "VendorBillLines" ADD CONSTRAINT "FK_5dae1ce181b14789dbf1deaab44" FOREIGN KEY ("ProductId") REFERENCES "Products"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "VendorBills" ADD CONSTRAINT "FK_9897bfef638ed410b8b9a83ee7d" FOREIGN KEY ("ContactId") REFERENCES "Contacts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // Filtered unique index (Draft support): unlimited blank-BillNumber
        // drafts may coexist; uniqueness applies only once a bill is posted
        // and gets a real number. Same pattern as UQ_Invoices_InvoiceNumber
        // and UQ_JournalEntries_Journal_Reference.
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_VendorBills_BillNumber" ON "VendorBills" ("BillNumber") WHERE "BillNumber" <> ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_VendorBills_BillNumber" ON "VendorBills"`);
        await queryRunner.query(`ALTER TABLE "VendorBills" DROP CONSTRAINT "FK_9897bfef638ed410b8b9a83ee7d"`);
        await queryRunner.query(`ALTER TABLE "VendorBillLines" DROP CONSTRAINT "FK_5dae1ce181b14789dbf1deaab44"`);
        await queryRunner.query(`ALTER TABLE "VendorBillLines" DROP CONSTRAINT "FK_835205dd835c99c8d9119384073"`);
        await queryRunner.query(`DROP TABLE "VendorBills"`);
        await queryRunner.query(`DROP TABLE "VendorBillLines"`);
    }

}
