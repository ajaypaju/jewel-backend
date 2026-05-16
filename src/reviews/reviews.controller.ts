import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { CurrentUser } from '../auth/guards/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // POST /api/products/:productId/reviews — create review (auth)
  @UseGuards(JwtAuthGuard)
  @Post('products/:productId/reviews')
  create(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, productId, dto);
  }

  // GET /api/products/:productId/reviews — public, paginated
  @Get('products/:productId/reviews')
  findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: PaginationQuery,
  ) {
    return this.reviewsService.findByProduct(productId, query.page, query.limit);
  }

  // PATCH /api/reviews/:id — update own review (auth)
  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user.id, id, dto);
  }

  // DELETE /api/reviews/:id — delete own review (auth)
  @UseGuards(JwtAuthGuard)
  @Delete('reviews/:id')
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.remove(user.id, id);
  }

  // PATCH /api/admin/reviews/:id/moderate — admin only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/reviews/:id/moderate')
  moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isApproved') isApproved: boolean,
  ) {
    return this.reviewsService.moderate(id, isApproved);
  }
}
