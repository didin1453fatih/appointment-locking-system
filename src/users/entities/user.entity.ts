import { AppointmentLock } from 'src/appointment/entities/appointment-lock.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, OneToMany } from 'typeorm';

@Index(
    'user_email_unique',
    ['email'],
    { unique: true }
)
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column(
        {
            type: 'varchar',
            length: 100,
            nullable: false
        }
    )
    name: string;

    @Column(
        {
            type: 'varchar',
            length: 100,
            nullable: false
        }
    )
    email: string;

    @Column(
        {
            type: 'varchar',
            length: 255,
            nullable: false
        }
    )
    password: string;

    @Column({
        type: 'boolean',
        default: false
    })
    isAdmin: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => AppointmentLock, appointmentLock => appointmentLock.requestForceReleaseByUser)
    requestForceRelease: AppointmentLock[];

    @OneToMany(() => AppointmentLock, appointmentLock => appointmentLock.requestControlByUser)
    requestControlAppointmentLocks: AppointmentLock[];

    @OneToMany(() => AppointmentLock, appointmentLock => appointmentLock.user)
    appointmentLocks: AppointmentLock[];
}