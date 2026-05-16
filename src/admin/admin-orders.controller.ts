import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import * as express from 'express';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';
import { OrdersService } from '../orders/orders.service.js';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

@UseGuards(AdminAuthGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const query = req.query as any;
    const page = parseInt(query.page as string, 10) || 1;
    const status = (query.status as string) || '';

    // Reuse the existing admin findAll — already includes user relation, pagination, status filter
    const result = await this.ordersService.findAll({
      status: status || undefined,
      page,
      limit: 20,
    });

    res.render('orders/list', {
      admin: session.adminUser,
      flash,
      orders: result.orders,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      statusFilter: status,
      statuses: ORDER_STATUSES,
      currentPage: 'orders',
    });
  }

  @Get(':id')
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    // Reuse existing admin method — loads order + items (snapshots) + user
    const order = await this.ordersService.findOneAdmin(id);

    res.render('orders/detail', {
      admin: session.adminUser,
      flash,
      order,
      statuses: ORDER_STATUSES,
      currentPage: 'orders',
    });
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      const { status, trackingNumber } = req.body;
      // Reuse the existing service method — no status-transition logic duplicated here
      await this.ordersService.updateStatus(id, {
        status,
        trackingNumber: trackingNumber?.trim() || undefined,
      });
      session.flash = { type: 'success', message: `Order status updated to "${status}"` };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to update status' };
    }
    res.redirect(`/admin/orders/${id}`);
  }
}
