import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { CurrentUser } from '../auth/guards/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --- User endpoints ---

  @UseGuards(JwtAuthGuard)
  @Post('orders')
  createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  findMine(@CurrentUser() user: User, @Query() query: QueryOrdersDto) {
    return this.ordersService.findMine(user.id, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  findOneMine(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findOneMine(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/cancel')
  cancelOrder(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.cancelOrder(user.id, id);
  }

  // --- Admin API endpoints ---
  // Path uses 'manage/orders' (not 'admin/orders') to avoid collision with
  // the EJS admin panel routes which occupy the /admin/* namespace.
  // Final URLs: /api/manage/orders, /api/manage/orders/:id, /api/manage/orders/:id/status

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('manage/orders')
  findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('manage/orders/:id')
  findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('manage/orders/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
