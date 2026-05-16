import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    private readonly productsService: ProductsService,
  ) {}

  // Idempotent: adding an existing product returns the existing row, no error
  async add(userId: string, productId: string): Promise<WishlistItem> {
    await this.productsService.findOne(productId); // verify product exists

    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    if (existing) return existing;

    const item = this.wishlistRepository.create({ userId, productId });
    return this.wishlistRepository.save(item);
  }

  async getMine(userId: string): Promise<WishlistItem[]> {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  // Remove by productId (not wishlist item ID) — matches frontend toggle behavior
  async removeByProductId(userId: string, productId: string): Promise<void> {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });
    if (!item) {
      throw new NotFoundException('Product not in wishlist');
    }
    await this.wishlistRepository.remove(item);
  }

  async clear(userId: string): Promise<void> {
    await this.wishlistRepository.delete({ userId });
  }
}
