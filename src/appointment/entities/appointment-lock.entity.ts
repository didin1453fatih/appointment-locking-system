import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, Index } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('appointment_locks')
@Index('appointment_lock_unique', ['appointmentId', 'userId'], { unique: true })
export class AppointmentLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appointmentId: string;

  @Column()
  userId: string;

  @Column({ nullable: true, type: 'json' })
  userInfo: {
    name: string;
    email: string;
    position?: { x: number; y: number }; // For cursor position (bonus)
  };

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Appointment, appointment => appointment.appointmentLock)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}