import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, Index, In } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('appointment_locks')
@Index('appointment_lock_user_unique', ['appointmentId'], { unique: true })
@Index('appointment_lock_request_control_unique', ['requestControlByUserId', 'appointmentId'], { unique: true })
@Index('appointment_lock_request_force_release_unique', ['requestForceReleaseByUserId', 'appointmentId'], { unique: true })
export class AppointmentLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid'
  })
  appointmentId: string;

  @Column({
    type: 'uuid',
    nullable: false
  })
  userId: string;

  @Column({ nullable: true, type: 'json' })
  userInfo: {
    name: string;
    email: string;
    position?: { x: number; y: number }; // For cursor position (bonus)
  };


  @Column({
    type: 'uuid',
    nullable: true
  })
  requestControlByUserId: string | null;


  @Column({
    type: 'uuid',
    nullable: true
  })
  requestForceReleaseByUserId: string | null;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;


  @OneToOne(() => User)
  @JoinColumn({ name: 'requestForceReleaseByUserId' })
  requestForceReleaseByUser: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'requestControlByUserId' })
  requestControlByUser: User;

  @OneToOne(() => Appointment, appointment => appointment.appointmentLock)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}