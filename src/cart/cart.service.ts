import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CartItem } from './entities/cart-item.entity.js';
import { AddToCartDto } from './dto/add-to-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { ProductsService } from '../products/products.service.js';

// Business rules from frontend analysis Section 11.6
const SHIPPING_FLAT = 15;
const FREE_SHIPPING_THRESHOLD = 100;
const TAX_RATE = 0.08;

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartItem> {
    const product = await this.productsService.findOne(dto.productId);

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, requested: ${dto.quantity}`,
      );
    }

    // Check if this exact (user, product, size) combination already exists
    const existing = await this.cartRepository.findOne({
      where: {
        userId,
        productId: dto.productId,
        size: dto.size ?? IsNull(),
      },
    });

    if (existing) {
      // Increment quantity instead of duplicating
      const newQty = existing.quantity + dto.quantity;
      if (newQty > product.stock) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stock}, in cart: ${existing.quantity}, adding: ${dto.quantity}`,
        );
      }
      existing.quantity = newQty;
      return this.cartRepository.save(existing);
    }

    const item = this.cartRepository.create({
      userId,
      productId: dto.productId,
      quantity: dto.quantity,
      size: dto.size ?? null,
    });
    return this.cartRepository.save(item);
  }

  async getCart(userId: string) {
    const items = await this.cartRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'ASC' },
    });

    // Calculate totals using business rules from Section 11.6
    let subtotal = 0;
    for (const item of items) {
      const price =
        item.product.isOnSale && item.product.salePrice
          ? Number(item.product.salePrice)
          : Number(item.product.originalPrice);
      subtotal += price * item.quantity;
    }

    // Empty cart = all zeros. Otherwise: $15 flat, free over $100
    const shipping = items.length === 0 ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    subtotal = Math.round(subtotal * 100) / 100;

    return { items, subtotal, shipping, tax, total };
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartItem> {
    const item = await this.findOwnedItem(userId, itemId);

    const product = await this.productsService.findOne(item.productId);
    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, requested: ${dto.quantity}`,
      );
    }

    item.quantity = dto.quantity;
    if (dto.size !== undefined) {
      item.size = dto.size;
    }
    return this.cartRepository.save(item);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const item = await this.findOwnedItem(userId, itemId);
    await this.cartRepository.remove(item);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }

  // Used by OrdersService to get raw items for checkout
  async getCartItems(userId: string): Promise<CartItem[]> {
    return this.cartRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
    });
  }

  private async findOwnedItem(userId: string, itemId: string): Promise<CartItem> {
    const item = await this.cartRepository.findOne({
      where: { id: itemId },
      relations: ['product'],
    });
    if (!item) {
      throw new NotFoundException(`Cart item "${itemId}" not found`);
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('You cannot modify another user\'s cart');
    }
    return item;
  }
}
