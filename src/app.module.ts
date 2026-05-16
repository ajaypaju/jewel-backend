import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { NewsletterModule } from './newsletter/newsletter.module.js';
import { AdminModule } from './admin/admin.module.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get<string>('DATABASE_USER', 'postgres'),
        password: config.get<string>('DATABASE_PASSWORD', ''),
        database: config.get<string>('DATABASE_NAME', 'jewel'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    CategoriesModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    ReviewsModule,
    CouponsModule,
    NewsletterModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ClassSerializerInterceptor makes @Exclude() decorators work on entities.
    // Without this, passwordHash would still appear in JSON responses.
    // It must run BEFORE TransformInterceptor so the exclusion happens
    // before the response is wrapped in { success, message, data }.
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
