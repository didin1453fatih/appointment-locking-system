import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnAppointment1749176760401 implements MigrationInterface {
    name = 'AddColumnAppointment1749176760401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD "patientName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "datebirth" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "gender" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "doctorName" character varying`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "note" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "doctorName"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "gender"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "datebirth"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "patientName"`);
    }

}
