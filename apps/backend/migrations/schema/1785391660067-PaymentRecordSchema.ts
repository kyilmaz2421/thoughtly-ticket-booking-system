import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentRecordSchema1785391660067 implements MigrationInterface {
    name = 'PaymentRecordSchema1785391660067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "booking_payment_status_chk"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "payment_status"`);
        // A payment_record row only exists when a payment succeeded.
        // Failed payments leave no trace — the booking transaction rolls back entirely.
        await queryRunner.query(`
            CREATE TABLE "payment_record" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "booking_id" uuid NOT NULL,
                "price_cents" integer NOT NULL,
                "transaction_id" character varying(100) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "payment_record_price_cents_chk" CHECK (price_cents >= 0),
                CONSTRAINT "payment_record_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "booking"("id"),
                CONSTRAINT "PK_payment_record" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "payment_record"`);
        await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN "payment_status" character varying(20) NOT NULL DEFAULT 'success'`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "booking_payment_status_chk" CHECK (payment_status IN ('pending','success','failed'))`);
    }
}
