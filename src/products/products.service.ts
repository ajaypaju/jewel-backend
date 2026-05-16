import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductsDto, ProductSortBy } from './dto/query-products.dto.js';
import { CategoriesService } from '../categories/categories.service.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    // Cross-module injection: we use CategoriesService to verify the category exists
    // before creating/updating a product. This works because CategoriesModule exports it.
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    // Verify category exists (throws 404 if not)
    await this.categoriesService.findOne(dto.categoryId);

    // Check slug uniqueness
    const existingSlug = await this.productsRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Product with slug "${dto.slug}" already exists`);
    }

    // Check SKU uniqueness (if provided)
    if (dto.sku) {
      const existingSku = await this.productsRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    // Business rule from Section 11.6: sale price must be less than original price
    if (dto.salePrice != null && dto.salePrice >= dto.originalPrice) {
      throw new BadRequestException('salePrice must be less than originalPrice');
    }

    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // QueryBuilder gives us fine-grained control over the SQL.
    // Unlike .find(), we can conditionally add WHERE clauses, JOINs, and ORDER BY
    // based on which query params the user actually sent.
    const qb = this.productsRepository
      .createQueryBuilder('product')
      // leftJoinAndSelect loads the category relation (same as eager, but explicit in QB)
      .leftJoinAndSelect('product.category', 'category')
      // Only show active products
      .where('product.isActive = :isActive', { isActive: true });

    // Filter by category slug — join is already done above
    if (query.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', {
        categorySlug: query.categorySlug,
      });
    }

    if (query.isOnSale !== undefined) {
      qb.andWhere('product.isOnSale = :isOnSale', { isOnSale: query.isOnSale });
    }

    if (query.isNewArrival !== undefined) {
      qb.andWhere('product.isNewArrival = :isNewArrival', {
        isNewArrival: query.isNewArrival,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.originalPrice >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('product.originalPrice <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    // Search across multiple text fields using ILIKE (case-insensitive)
    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.materials ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Sorting
    switch (query.sortBy) {
      case ProductSortBy.PRICE_ASC:
        qb.orderBy('product.originalPrice', 'ASC');
        break;
      case ProductSortBy.PRICE_DESC:
        qb.orderBy('product.originalPrice', 'DESC');
        break;
      case ProductSortBy.NAME:
        qb.orderBy('product.name', 'ASC');
        break;
      case ProductSortBy.NEWEST:
      default:
        qb.orderBy('product.createdAt', 'DESC');
        break;
    }

    // Pagination: skip = (page - 1) * limit
    qb.skip((page - 1) * limit).take(limit);

    // getManyAndCount runs TWO queries: one for the page of results, one for the total count.
    // This is more efficient than fetching all rows and counting in JS.
    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countActive(): Promise<number> {
    return this.productsRepository.count({ where: { isActive: true } });
  }

  async findLowStock(threshold = 5): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      order: { stock: 'ASC' },
      take: 10,
    }).then(products => products.filter(p => p.stock < threshold));
  }

  // Find by ID INCLUDING inactive (for admin)
  async findOneAdmin(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return product;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug, isActive: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // If changing category, verify the new one exists
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.categoriesService.findOne(dto.categoryId);
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productsRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Product with slug "${dto.slug}" already exists`);
      }
    }

    // Check SKU uniqueness if changing
    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productsRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException(`Product with SKU "${dto.sku}" already exists`);
      }
    }

    // Business rule: salePrice < originalPrice
    const effectiveOriginal = dto.originalPrice ?? product.originalPrice;
    const effectiveSale = dto.salePrice !== undefined ? dto.salePrice : product.salePrice;
    if (effectiveSale != null && effectiveSale >= effectiveOriginal) {
      throw new BadRequestException('salePrice must be less than originalPrice');
    }

    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  // Soft delete: set isActive=false instead of removing the row.
  // This preserves the product for historical order references and analytics.
  // The findOne/findAll methods filter by isActive=true, so it "disappears" from the API.
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productsRepository.save(product);
  }

  // --- Image management ---

  async addImages(id: string, imageUrls: string[]): Promise<Product> {
    const product = await this.findOne(id);
    product.images = [...product.images, ...imageUrls];
    return this.productsRepository.save(product);
  }

  async removeImage(id: string, imageUrl: string): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.images.includes(imageUrl)) {
      throw new NotFoundException('Image URL not found on this product');
    }

    // Remove from DB
    product.images = product.images.filter((url) => url !== imageUrl);
    const updated = await this.productsRepository.save(product);

    // Delete file from disk — swallow ENOENT (file already gone) gracefully
    const filePath = path.join(process.cwd(), imageUrl);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }

    return updated;
  }
}
