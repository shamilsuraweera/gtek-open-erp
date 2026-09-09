import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'nvarchar', unique: true })
  Email: string;

  @Column({ type: 'nvarchar' })
  PasswordHash: string;

  @Column({ type: 'nvarchar', default: 'User' })
  Role: string;

  @Column({ type: 'bit', default: true })
  IsActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  CreatedAt: Date;
}
