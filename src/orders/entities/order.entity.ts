import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { OrderItem } from './order-item.entity.js';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // JSONB snapshot of address at checkout time — NOT a FK.
  // Even if the user deletes/changes their address later, the order
  // keeps the exact address it was shipped to.
  @Column({ type: 'jsonb' })
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  paymentStatus: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  trackingNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // OneToMany: one order has many items. eager loads them with the order.
  @OneToMany(() => OrderItem, (item) => item.order, { eager: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
