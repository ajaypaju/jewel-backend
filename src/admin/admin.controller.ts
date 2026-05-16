import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';
import { ProductsService } from '../products/products.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { UsersService } from '../users/users.service.js';

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async getDashboard(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const [
      productCount,
      categories,
      orderCount,
      userCount,
      revenue,
      ordersByStatus,
      recentOrders,
      lowStock,
    ] = await Promise.all([
      this.productsService.countActive(),
      this.categoriesService.findAll(),
      this.ordersService.totalCount(),
      this.usersService.count(),
      this.ordersService.totalRevenue(),
      this.ordersService.countByStatus(),
      this.ordersService.findRecent(5),
      this.productsService.findLowStock(5),
    ]);

    res.render('dashboard', {
      admin: session.adminUser,
      flash,
      stats: {
        productCount,
        categoryCount: categories.length,
        orderCount,
        userCount,
        revenue,
        ordersByStatus,
      },
      recentOrders,
      lowStock,
      currentPage: 'dashboard',
    });
  }
}
