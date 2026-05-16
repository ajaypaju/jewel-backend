import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // decimal(10,2) — up to 99,999,999.99
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number | null;

  @Column({ type: 'boolean', default: false })
  isOnSale: boolean;

  // ManyToOne: many products belong to one category.
  // eager: true means the category object is auto-loaded with every product query —
  // so product.category is always a full Category object, not just an ID.
  // onDelete: 'RESTRICT' prevents deleting a category that has products.
  @ManyToOne(() => Category, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'uuid' })
  categoryId: string;

  // Postgres native array — stored as actual text[] column, not a comma-separated string.
  // Supports proper array queries like ANY() and array containment operators.
  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'text', array: true, nullable: true })
  sizes: string[] | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  materials: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  weight: string | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  sku: string | null;

  @Column({ type: 'boolean', default: false })
  isNewArrival: boolean;

  // Soft delete flag — never hard-delete products because orders reference them.
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Computed from reviews — updated when reviews are added/removed (Step 5+)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
