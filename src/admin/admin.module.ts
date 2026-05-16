import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminAuthController } from './admin-auth.controller.js';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { AdminReviewsController } from './admin-reviews.controller.js';
import { AdminCouponsController } from './admin-coupons.controller.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminNewsletterController } from './admin-newsletter.controller.js';
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
  controllers: [
    AdminAuthController,
    AdminController,
    AdminProductsController,
    AdminCategoriesController,
    AdminOrdersController,
    AdminReviewsController,
    AdminCouponsController,
    AdminUsersController,
    AdminNewsletterController,
  ],
})
export class AdminModule {}
