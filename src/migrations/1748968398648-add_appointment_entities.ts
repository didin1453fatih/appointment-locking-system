import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointmentEntities1748968398648 implements MigrationInterface {
    name = 'AddAppointmentEntities1748968398648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "startTime" TIMESTAMP NOT NULL, "endTime" TIMESTAMP NOT NULL, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointment_locks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointmentId" uuid NOT NULL, "userId" uuid NOT NULL, "userInfo" json, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_5bb9891881e8545f801b197621" UNIQUE ("appointmentId"), CONSTRAINT "PK_9d217b9874467547c3d8a290f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "appointment_lock_unique" ON "appointment_locks" ("appointmentId", "userId") `);
        await queryRunner.query(`ALTER TABLE "appointment_locks" ADD CONSTRAINT "FK_5bb9891881e8545f801b1976216" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" ADD CONSTRAINT "FK_f720223f8c153e3bba9b2e4048b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment_locks" DROP CONSTRAINT "FK_f720223f8c153e3bba9b2e4048b"`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" DROP CONSTRAINT "FK_5bb9891881e8545f801b1976216"`);
        await queryRunner.query(`DROP INDEX "public"."appointment_lock_unique"`);
        await queryRunner.query(`DROP TABLE "appointment_locks"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
    }

}
