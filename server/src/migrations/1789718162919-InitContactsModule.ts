import { MigrationInterface, QueryRunner } from "typeorm";

export class InitContactsModule1789718162919 implements MigrationInterface {
    name = 'InitContactsModule1789718162919'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Contacts" ("Id" int NOT NULL IDENTITY(1,1), "Name" nvarchar(200) NOT NULL, "Email" varchar(255), "Phone" varchar(50), "IsCustomer" bit NOT NULL CONSTRAINT "DF_b4ac66fb8beab93e9bbb2ad12c0" DEFAULT 1, "IsVendor" bit NOT NULL CONSTRAINT "DF_c9f5e4eb14036cfd52f2b1c2ef8" DEFAULT 0, "IsActive" bit NOT NULL CONSTRAINT "DF_95bf31c785ba74326ccb1e74629" DEFAULT 1, "CreatedAt" datetime2 NOT NULL CONSTRAINT "DF_40eec911997607dd60a6f866dcb" DEFAULT getdate(), "UpdatedAt" datetime2 NOT NULL CONSTRAINT "DF_a728b1ca5e75a58d31b4ed15541" DEFAULT getdate(), "AccountsReceivableId" int, "AccountsPayableId" int, CONSTRAINT "PK_4fa5417dc68367747ca3b69be9d" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`ALTER TABLE "Contacts" ADD CONSTRAINT "FK_bcd0763290a022432352e8c4bad" FOREIGN KEY ("AccountsReceivableId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Contacts" ADD CONSTRAINT "FK_393269e5a2f402e2416986380eb" FOREIGN KEY ("AccountsPayableId") REFERENCES "Accounts"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Contacts" DROP CONSTRAINT "FK_393269e5a2f402e2416986380eb"`);
        await queryRunner.query(`ALTER TABLE "Contacts" DROP CONSTRAINT "FK_bcd0763290a022432352e8c4bad"`);
        await queryRunner.query(`DROP TABLE "Contacts"`);
    }

}
