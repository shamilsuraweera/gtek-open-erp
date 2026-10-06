import { MigrationInterface, QueryRunner } from "typeorm";

export class InitInventoryModule1789667028073 implements MigrationInterface {
    name = 'InitInventoryModule1789667028073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ProductCategories" ("Id" int NOT NULL IDENTITY(1,1), "Name" nvarchar(200) NOT NULL, "Description" nvarchar(500), "IsActive" bit NOT NULL CONSTRAINT "DF_2fc5ab6c4246ee8fd5e5acd1e4b" DEFAULT 1, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_ad8be4d635244be1197eba4b9cb" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_c8957937fcc59dd42c262338d95" DEFAULT getdate(), "IncomeAccountId" int, "ExpenseAccountId" int, CONSTRAINT "UQ_0488466066e9532e2226b2138e9" UNIQUE ("Name"), CONSTRAINT "PK_196dbfd676dfc95e3d91b0f63b7" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE TABLE "Products" ("Id" int NOT NULL IDENTITY(1,1), "Name" nvarchar(200) NOT NULL, "SKU" varchar(50) NOT NULL, "Type" nvarchar(20) CONSTRAINT CHK_ff81872ca6179feab2e4aed2d2_ENUM CHECK(Type IN ('Storable','Consumable','Service')) NOT NULL, "SalePrice" decimal(19,4) NOT NULL CONSTRAINT "DF_5b5206afe4bd76dd41b7828d81b" DEFAULT 0, "CostPrice" decimal(19,4) NOT NULL CONSTRAINT "DF_f1cd32203a2e9effa16e3803379" DEFAULT 0, "IsActive" bit NOT NULL CONSTRAINT "DF_38008b6d5d5bce8601a3b5745a2" DEFAULT 1, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_303a08027af2771527d9380759c" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_404de7f33915527ff6ce21373b6" DEFAULT getdate(), "CategoryId" int NOT NULL, CONSTRAINT "UQ_236619fdffe38e28211fbf1e1dc" UNIQUE ("SKU"), CONSTRAINT "PK_a70dbd7a49ef4bad9c0dc14cbd4" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "ProductCategories" ADD CONSTRAINT "FK_6f26d78948358c1f26c33bf4e4c" FOREIGN KEY ("IncomeAccountId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ProductCategories" ADD CONSTRAINT "FK_699af5b3f64c87b94b0abbda71b" FOREIGN KEY ("ExpenseAccountId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Products" ADD CONSTRAINT "FK_7e907f7e9043ee05a2c99f8d51d" FOREIGN KEY ("CategoryId") REFERENCES "ProductCategories"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Products" DROP CONSTRAINT "FK_7e907f7e9043ee05a2c99f8d51d"`);
        await queryRunner.query(`ALTER TABLE "ProductCategories" DROP CONSTRAINT "FK_699af5b3f64c87b94b0abbda71b"`);
        await queryRunner.query(`ALTER TABLE "ProductCategories" DROP CONSTRAINT "FK_6f26d78948358c1f26c33bf4e4c"`);
        await queryRunner.query(`DROP TABLE "Products"`);
        await queryRunner.query(`DROP TABLE "ProductCategories"`);
    }

}
