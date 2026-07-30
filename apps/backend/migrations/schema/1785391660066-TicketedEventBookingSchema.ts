import { MigrationInterface, QueryRunner } from "typeorm";

export class TicketedEventBookingSchema1785391660066 implements MigrationInterface {
    name = 'TicketedEventBookingSchema1785391660066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_host" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" character varying(255) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_42ff6901a665b1c910fb11eead6" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`CREATE TABLE "venue" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "address_line1" character varying(255) NOT NULL,
                "address_line2" character varying(255) NOT NULL,
                "city" character varying(100) NOT NULL,
                "state_province" character varying(100),
                "postal_or_zip_code" character varying(20) NOT NULL,
                "country_code" character(2) NOT NULL,
                "vip_capacity" integer NOT NULL,
                "front_row_capacity" integer NOT NULL,
                "ga_capacity" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "venue_address_uq" UNIQUE ("address_line1", "address_line2", "city", "state_province", "postal_or_zip_code", "country_code"),
                CONSTRAINT "venue_ga_capacity_chk" CHECK (ga_capacity >= 0),
                CONSTRAINT "venue_front_row_capacity_chk" CHECK (front_row_capacity >= 0),
                CONSTRAINT "venue_vip_capacity_chk" CHECK (vip_capacity >= 0),
                CONSTRAINT "PK_c53deb6d1bcb088f9d459e7dbc0" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`CREATE TABLE "event" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "start_datetime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_datetime" TIMESTAMP WITH TIME ZONE NOT NULL,
                "event_type" character varying(50) NOT NULL,
                "event_host_id" uuid NOT NULL,
                "venue_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "event_start_datetime_end_datetime_venue_id_uq" UNIQUE ("start_datetime", "end_datetime", "venue_id"),
                CONSTRAINT "event_type_chk" CHECK (event_type IN ('concert', 'sporting', 'broadway')),
                CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`CREATE TABLE "ticket" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "event_id" uuid NOT NULL,
                "section" character varying(50) NOT NULL,
                "seat_number" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "ticket_event_id_section_seat_number_uq" UNIQUE ("event_id", "section", "seat_number"),
                CONSTRAINT "ticket_section_chk" CHECK (section IN ('VIP', 'Front Row', 'GA')),
                CONSTRAINT "ticket_seat_number_chk" CHECK (seat_number >= 0),
                CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "user_email_uq" UNIQUE ("email"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`CREATE TABLE "booking" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "ticket_id" uuid NOT NULL,
                "payment_status" character varying(20) NOT NULL,
                CONSTRAINT "booking_ticket_id_uq" UNIQUE ("ticket_id"),
                CONSTRAINT "REL_85869580d29c5c2dcb1e21733c" UNIQUE ("ticket_id"),
                CONSTRAINT "booking_payment_status_chk" CHECK (payment_status IN ('pending', 'success', 'failed')),
                CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "event_event_host_id_fk" FOREIGN KEY ("event_host_id") REFERENCES "event_host"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "event_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD CONSTRAINT "ticket_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "booking_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "booking_ticket_id_fk"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "booking_user_id_fk"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "ticket_event_id_fk"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "event_venue_id_fk"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "event_event_host_id_fk"`);
        await queryRunner.query(`DROP TABLE "booking"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "venue"`);
        await queryRunner.query(`DROP TABLE "event_host"`);
    }

}
