import { MigrationInterface, QueryRunner } from "typeorm";

export class PerformanceIndexes1785477286122 implements MigrationInterface {
    name = 'PerformanceIndexes1785477286122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "ticket_event_id_idx" ON "ticket"  ("event_id") `);
        await queryRunner.query(`CREATE INDEX "booking_user_id_idx" ON "booking"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "payment_record_user_id_idx" ON "payment_record"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "payment_record_booking_id_idx" ON "payment_record"  ("booking_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."payment_record_booking_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."payment_record_user_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."booking_user_id_idx"`);
        await queryRunner.query(`DROP INDEX "public"."ticket_event_id_idx"`);
    }

}
