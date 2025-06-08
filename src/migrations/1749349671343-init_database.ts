import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1749349671343 implements MigrationInterface {
    name = 'InitDatabase1749349671343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointments_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "patientName" character varying(255) NOT NULL, "datebirth" date NOT NULL, "gender" "public"."appointments_gender_enum" NOT NULL, "phone" character varying(15), "address" text, "doctorName" character varying(255), "note" text, "description" text, "startTime" TIMESTAMP NOT NULL, "endTime" TIMESTAMP NOT NULL, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointment_locks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointmentId" uuid NOT NULL, "userId" uuid NOT NULL, "userInfo" json, "requestControlByUserId" uuid, "requestForceReleaseByUserId" uuid, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_fcacee6d89d32a1f9d6c9923fb" UNIQUE ("requestForceReleaseByUserId"), CONSTRAINT "REL_abc8f0bfc13cd7b4d1370caa6d" UNIQUE ("requestControlByUserId"), CONSTRAINT "REL_5bb9891881e8545f801b197621" UNIQUE ("appointmentId"), CONSTRAINT "PK_9d217b9874467547c3d8a290f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "appointment_lock_request_force_release_unique" ON "appointment_locks" ("requestForceReleaseByUserId", "appointmentId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "appointment_lock_request_control_unique" ON "appointment_locks" ("requestControlByUserId", "appointmentId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "appointment_lock_user_unique" ON "appointment_locks" ("appointmentId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "isAdmin" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_email_unique" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "appointment_locks" ADD CONSTRAINT "FK_fcacee6d89d32a1f9d6c9923fb4" FOREIGN KEY ("requestForceReleaseByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" ADD CONSTRAINT "FK_abc8f0bfc13cd7b4d1370caa6d2" FOREIGN KEY ("requestControlByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" ADD CONSTRAINT "FK_5bb9891881e8545f801b1976216" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" ADD CONSTRAINT "FK_f720223f8c153e3bba9b2e4048b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment_locks" DROP CONSTRAINT "FK_f720223f8c153e3bba9b2e4048b"`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" DROP CONSTRAINT "FK_5bb9891881e8545f801b1976216"`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" DROP CONSTRAINT "FK_abc8f0bfc13cd7b4d1370caa6d2"`);
        await queryRunner.query(`ALTER TABLE "appointment_locks" DROP CONSTRAINT "FK_fcacee6d89d32a1f9d6c9923fb4"`);
        await queryRunner.query(`DROP INDEX "public"."user_email_unique"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."appointment_lock_user_unique"`);
        await queryRunner.query(`DROP INDEX "public"."appointment_lock_request_control_unique"`);
        await queryRunner.query(`DROP INDEX "public"."appointment_lock_request_force_release_unique"`);
        await queryRunner.query(`DROP TABLE "appointment_locks"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_gender_enum"`);
    }

}
