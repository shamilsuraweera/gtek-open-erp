import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDisplayName1789730000000 implements MigrationInterface {
    name = 'AddUserDisplayName1789730000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "DisplayName" nvarchar(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "DisplayName"`);
    }

}
