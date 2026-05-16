import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { CartService } from '../cart/cart.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { Product } from '../products/entities/product.entity.js';
import { CartItem } from '../cart/entities/cart-item.entity.js';

// Business rules from analysis Section 11.6
const SHIPPING_FLAT = 15;
const FREE_SHIPPING_THRESHOLD = 100;
const TAX_RATE = 0.08;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Load cart items
    const cartItems = await this.cartService.getCartItems(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Server-side money math — NEVER trust the client for amounts.
    // Even though the cart endpoint already computes these, we recompute
    // from current product data to prevent stale-price exploits.
    let subtotal = 0;
    const orderItemsData: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      size: string | null;
      image: string | null;
    }> = [];

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      // Verify product still active and has stock
      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.name}" is no longer available`);
      }
      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${cartItem.quantity}`,
        );
      }

      const unitPrice =
        product.isOnSale && product.salePrice
          ? Number(product.salePrice)
          : Number(product.originalPrice);

      subtotal += unitPrice * cartItem.quantity;

      orderItemsData.push({
        productId: product.id,
        name: product.name,
        price: unitPrice,
        quantity: cartItem.quantity,
        size: cartItem.size,
        image: product.images.length > 0 ? product.images[0] : null,
      });
    }

    // 3. Compute totals
    subtotal = Math.round(subtotal * 100) / 100;
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;

    // Validate coupon if provided
    let discount = 0;
    if (dto.couponCode) {
      const result = await this.couponsService.validate(dto.couponCode, subtotal);
      discount = result.discount;
    }

    const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;

    // 4. Execute everything in a TRANSACTION.
    // DataSource.transaction() wraps all operations in BEGIN...COMMIT.
    // If any step throws, it automatically runs ROLLBACK.
    const order = await this.dataSource.transaction(async (manager) => {
      // 4a. Create order
      const newOrder = manager.create(Order, {
        userId,
        status: 'pending',
        subtotal,
        shipping,
        tax,
        discount,
        total,
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        paymentStatus: 'paid', // Simplified — real payment integration would set 'pending' first
        couponCode: dto.couponCode ?? null,
      });
      const savedOrder = await manager.save(Order, newOrder);

      // 4b. Create order items (snapshots)
      const items: OrderItem[] = [];
      for (const itemData of orderItemsData) {
        const orderItem = manager.create(OrderItem, {
          orderId: savedOrder.id,
          ...itemData,
        });
        items.push(await manager.save(OrderItem, orderItem));
      }

      // 4c. Decrement stock for each product
      for (const itemData of orderItemsData) {
        await manager.decrement(
          Product,
          { id: itemData.productId },
          'stock',
          itemData.quantity,
        );
      }

      // 4d. Increment coupon usage
      if (dto.couponCode) {
        await this.couponsService.incrementUsage(dto.couponCode);
      }

      // 4e. Clear cart
      await manager.delete(CartItem, { userId });

      savedOrder.items = items;
      return savedOrder;
    });

    return order;
  }

  async totalCount(): Promise<number> {
    return this.ordersRepository.count();
  }

  async totalRevenue(): Promise<number> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'sum')
      .where('order.paymentStatus = :status', { status: 'paid' })
      .andWhere('order.status != :cancelled', { cancelled: 'cancelled' })
      .getRawOne();
    return parseFloat(result?.sum ?? '0');
  }

  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.status] = parseInt(r.count, 10);
    }
    return counts;
  }

  async findRecent(limit = 5): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findMine(userId: string, query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneMine(userId: string, orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('You cannot access another user\'s order');
    }
    return order;
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.findOneMine(userId, orderId);

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status "${order.status}". Only pending or confirmed orders can be cancelled.`,
      );
    }

    // Restore stock in a transaction
    await this.dataSource.transaction(async (manager) => {
      for (const item of order.items) {
        await manager.increment(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }
      order.status = 'cancelled';
      await manager.save(Order, order);
    });

    return order;
  }

  // --- Admin endpoints ---

  async findAll(query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('user.email ILIKE :search', { search: `%${query.search}%` });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneAdmin(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'user'],
    });
    if (!order) {
      throw new NotFoundException(`Order "${orderId}" not found`);
    }
    return order;
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOneAdmin(orderId);
    order.status = dto.status;
    if (dto.trackingNumber) {
      order.trackingNumber = dto.trackingNumber;
    }
    return this.ordersRepository.save(order);
  }
}
