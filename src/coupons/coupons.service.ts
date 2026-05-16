import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.toUpperCase();
    const existing = await this.couponsRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Coupon code "${code}" already exists`);
    }

    const coupon = this.couponsRepository.create({
      ...dto,
      code,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.couponsRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon "${id}" not found`);

    if (dto.code) dto.code = dto.code.toUpperCase();
    Object.assign(coupon, dto);
    if (dto.expiresAt) coupon.expiresAt = new Date(dto.expiresAt);
    return this.couponsRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon "${id}" not found`);
    await this.couponsRepository.remove(coupon);
  }

  // Validate a coupon and return the discount amount.
  // Used by OrdersService at checkout and by the validate endpoint.
  async validate(code: string, subtotal: number): Promise<{ discount: number; coupon: Coupon }> {
    const coupon = await this.couponsRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestException('Coupon is not active');
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.minOrder && subtotal < Number(coupon.minOrder)) {
      throw new BadRequestException(
        `Minimum order of $${coupon.minOrder} required for this coupon`,
      );
    }

    let discount: number;
    if (coupon.type === 'percent') {
      discount = Math.round(subtotal * (Number(coupon.value) / 100) * 100) / 100;
    } else {
      discount = Math.min(Number(coupon.value), subtotal); // can't discount more than subtotal
    }

    return { discount, coupon };
  }

  // Called inside order transaction after successful order creation
  async incrementUsage(code: string): Promise<void> {
    await this.couponsRepository.increment(
      { code: code.toUpperCase() },
      'usedCount',
      1,
    );
  }
}
