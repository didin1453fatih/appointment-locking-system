import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { AppointmentLock } from './appointment-lock.entity';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    patientName: string;

    @Column({
        type: 'date'
    })
    datebirth: Date;

    @Column()
    gender: string;

    @Column({
        nullable: true,
    })
    phone: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    address: string;

    @Column({ nullable: true })
    doctorName: string;

    @Column({ nullable: true })
    note: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'timestamp'
    })
    startTime: Date;

    @Column({
        type: 'timestamp'
    })
    endTime: Date;

    @Column({ default: 1 })
    version: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => AppointmentLock, lock => lock.appointment, { nullable: true })
    appointmentLock: AppointmentLock;
}