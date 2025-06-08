import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { AppointmentLock } from './appointment-lock.entity';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({
        type:'varchar',
        length: 255,
        nullable: false
    })
    patientName: string;

    @Column({
        type: 'date',
        nullable: false,
    })
    datebirth: Date;

    @Column({
        type: 'enum',
        enum: ['male', 'female'],
        nullable: false
    })
    gender: string;

    @Column({
        type: 'varchar',
        length: 15,
        nullable: true,
    })
    phone: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    address: string;

    @Column({ 
        type: 'varchar',
        length: 255,
        nullable: true
    })
    doctorName: string;

    @Column({
        type: 'text',
        nullable: true
    })
    note: string;

    @Column({
        type: 'text',
        nullable: true
    })
    description: string;

    @Column({
        nullable: false,
        type: 'timestamp'
    })
    startTime: Date;

    @Column({
        nullable: false,
        type: 'timestamp'
    })
    endTime: Date;

    @Column({ 
        type: 'int',
        nullable: false,
        default: 1
    })
    version: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => AppointmentLock, lock => lock.appointment, { nullable: true })
    appointmentLock: AppointmentLock;
}