import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entities/cart-item.entity.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem]),
    ProductsModule, // for stock validation
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // OrdersModule will need this
})
export class CartModule {}
