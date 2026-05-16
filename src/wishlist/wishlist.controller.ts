import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service.js';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/guards/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  add(@CurrentUser() user: User, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.add(user.id, dto.productId);
  }

  @Get()
  getMine(@CurrentUser() user: User) {
    return this.wishlistService.getMine(user.id);
  }

  // DELETE /api/wishlist/:productId — uses productId, not wishlist item ID
  @Delete(':productId')
  remove(
    @CurrentUser() user: User,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.removeByProductId(user.id, productId);
  }

  @Delete()
  clear(@CurrentUser() user: User) {
    return this.wishlistService.clear(user.id);
  }
}
