import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Pass-1 design promised uniqueness of Reference per Journal but never
 * implemented it as a DB constraint. Draft entries carry Reference = ''
 * (the app-level placeholder set in JournalEntriesService.createDraft,
 * since the column is NOT NULL with no default) until postEntry() assigns
 * the real sequence-based value, so the uniqueness rule must only apply to
 * non-empty references — a plain UNIQUE constraint would reject the second
 * draft ever created. A filtered index expresses exactly that.
 */
export class AddJournalEntryReferenceUniqueIndex1789578977321 implements MigrationInterface {
  name = 'AddJournalEntryReferenceUniqueIndex1789578977321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_JournalEntries_Journal_Reference" ON "JournalEntries" ("JournalId", "Reference") WHERE "Reference" <> ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_JournalEntries_Journal_Reference" ON "JournalEntries"`);
  }
}
