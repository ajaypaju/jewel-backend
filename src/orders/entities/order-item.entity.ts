import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity.js';

// Order items store SNAPSHOTS of product data at purchase time.
// If the product price changes or gets deleted later, the order
// still shows what the customer actually paid for.
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  productId: string;

  // Snapshot fields — captured at time of order, immutable
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  size: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;
}
