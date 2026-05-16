import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  // Lowercase + unique constraint ensures no duplicate emails
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // @Exclude() tells ClassSerializerInterceptor to strip this field from responses.
  // The password hash NEVER leaves the server — not in JSON responses, not in logs.
  // This is a defense-in-depth measure on top of not selecting it in queries.
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  // 'user' for regular customers, 'admin' for store managers
  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  // Loyalty tier — 'standard' by default, can be upgraded to 'VIP' etc.
  @Column({ type: 'varchar', length: 50, default: 'standard' })
  tier: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
