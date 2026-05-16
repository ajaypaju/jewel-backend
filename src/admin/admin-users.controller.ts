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
import { UsersService } from '../users/users.service.js';
import { OrdersService } from '../orders/orders.service.js';

@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const users = await this.usersService.findAll();

    res.render('users/list', {
      admin: session.adminUser,
      flash,
      users,
      currentPage: 'users',
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

    const [user, orders] = await Promise.all([
      this.usersService.findOne(id),
      this.ordersService.findByUser(id),
    ]);

    res.render('users/detail', {
      admin: session.adminUser,
      flash,
      user,
      orders,
      currentPage: 'users',
    });
  }

  @Post(':id/role')
  async setRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;

    // Self-demotion guard: block an admin from removing their own admin access
    if (id === session.adminUser.id && req.body.role === 'user') {
      session.flash = { type: 'error', message: "You can't remove your own admin access" };
      return res.redirect(`/admin/users/${id}`);
    }

    try {
      const { role } = req.body;
      await this.usersService.setRole(id, role);
      session.flash = { type: 'success', message: `User role updated to "${role}"` };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to update role' };
    }
    res.redirect(`/admin/users/${id}`);
  }
}
