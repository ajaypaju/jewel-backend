import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ProductsService } from '../products/products.service.js';
import { Order } from '../orders/entities/order.entity.js';
import { Product } from '../products/entities/product.entity.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, productId: string, dto: CreateReviewDto): Promise<Review> {
    await this.productsService.findOne(productId); // verify product exists

    const existing = await this.reviewsRepository.findOne({
      where: { productId, userId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Check if user has a delivered/shipped order containing this product
    const isVerified = await this.checkPurchaseVerification(userId, productId);

    const review = this.reviewsRepository.create({
      userId,
      productId,
      rating: dto.rating,
      comment: dto.comment,
      isVerified,
    });
    const saved = await this.reviewsRepository.save(review);

    await this.updateProductRating(productId);
    return saved;
  }

  async findByProduct(productId: string, page = 1, limit = 20) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { productId, isApproved: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const avgResult = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :productId AND review.isApproved = true', { productId })
      .getRawOne();

    return {
      reviews,
      averageRating: avgResult?.avg ? parseFloat(Number(avgResult.avg).toFixed(2)) : 0,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOwned(userId, reviewId);
    Object.assign(review, dto);
    const saved = await this.reviewsRepository.save(review);
    await this.updateProductRating(review.productId);
    return saved;
  }

  async remove(userId: string, reviewId: string, isAdmin = false): Promise<void> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review "${reviewId}" not found`);

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You cannot delete another user\'s review');
    }

    const productId = review.productId;
    await this.reviewsRepository.remove(review);
    await this.updateProductRating(productId);
  }

  async moderate(reviewId: string, isApproved: boolean): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review "${reviewId}" not found`);

    review.isApproved = isApproved;
    const saved = await this.reviewsRepository.save(review);
    await this.updateProductRating(review.productId);
    return saved;
  }

  // Recompute product.rating and product.reviewCount from approved reviews
  private async updateProductRating(productId: string): Promise<void> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.productId = :productId AND review.isApproved = true', { productId })
      .getRawOne();

    const rating = result?.avg ? parseFloat(Number(result.avg).toFixed(2)) : 0;
    const reviewCount = parseInt(result?.count ?? '0', 10);

    await this.productsRepository.update(productId, { rating, reviewCount });
  }

  private async checkPurchaseVerification(userId: string, productId: string): Promise<boolean> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('order.userId = :userId', { userId })
      .andWhere('item.productId = :productId', { productId })
      .andWhere('order.status IN (:...statuses)', { statuses: ['shipped', 'delivered'] })
      .getOne();

    return !!order;
  }

  private async findOwned(userId: string, reviewId: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Review "${reviewId}" not found`);
    if (review.userId !== userId) {
      throw new ForbiddenException('You cannot modify another user\'s review');
    }
    return review;
  }
}
