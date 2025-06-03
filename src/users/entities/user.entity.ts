import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

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
}