import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { ProductsModule } from '../products/products.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { UsersModule } from '../users/users.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { NewsletterModule } from '../newsletter/newsletter.module.js';

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    UsersModule,
    ReviewsModule,
    CouponsModule,
    NewsletterModule,
  ],
  controllers: [AdminAuthController, AdminController],
})
export class AdminModule {}
