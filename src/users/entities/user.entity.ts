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

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ default: false })
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