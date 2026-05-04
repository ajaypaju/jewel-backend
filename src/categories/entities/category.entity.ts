import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// @Entity() tells TypeORM "this class = a database table called 'categories'"
// Each property with @Column becomes a column in that table.
@Entity('categories')
export class Category {
  // UUID primary key — generated automatically by Postgres
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Display name, e.g. "Rings"
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // URL-friendly identifier, e.g. "rings" — must be unique
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  // Optional longer description
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Category image URL — just a string for now, real uploads come later
  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  // Controls display order in navigation (0 = first)
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  // Auto-set by TypeORM on INSERT
  @CreateDateColumn()
  createdAt: Date;

  // Auto-set by TypeORM on every UPDATE
  @UpdateDateColumn()
  updatedAt: Date;
}
