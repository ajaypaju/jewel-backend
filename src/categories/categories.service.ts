import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

// @Injectable() registers this class with NestJS's dependency injection container.
// When a controller declares it in its constructor, NestJS auto-creates and injects it.
@Injectable()
export class CategoriesService {
  constructor(
    // @InjectRepository tells NestJS to inject the TypeORM Repository for Category.
    // A Repository is TypeORM's interface for querying a specific table —
    // it gives us .find(), .findOne(), .save(), .remove(), etc.
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    // Check for duplicate slug before inserting
    const existing = await this.categoriesRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
    }

    // .create() builds a Category instance from the DTO (does NOT save to DB)
    // .save() actually runs the INSERT query
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
    });
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id); // throws 404 if missing

    // If the slug is being changed, check it doesn't conflict with another category
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoriesRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Category with slug "${dto.slug}" already exists`);
      }
    }

    // Object.assign merges the DTO fields onto the existing entity
    // .save() runs UPDATE because the entity already has an id
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id); // throws 404 if missing
    await this.categoriesRepository.remove(category);
  }
}
