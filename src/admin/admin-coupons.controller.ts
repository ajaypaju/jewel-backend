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
import { CouponsService } from '../coupons/coupons.service.js';

@UseGuards(AdminAuthGuard)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const coupons = await this.couponsService.findAll();

    res.render('coupons/list', {
      admin: session.adminUser,
      flash,
      coupons,
      currentPage: 'coupons',
    });
  }

  @Get('new')
  async newForm(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    res.render('coupons/form', {
      admin: session.adminUser,
      flash,
      coupon: null,
      currentPage: 'coupons',
      pageTitle: 'Add Coupon',
    });
  }

  @Post()
  async create(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    try {
      const b = req.body;
      const dto: any = {
        code: b.code?.trim(),
        type: b.type,
        value: b.value ? parseFloat(b.value) : undefined,
        minOrder: b.minOrder ? parseFloat(b.minOrder) : undefined,
        maxUses: b.maxUses ? parseInt(b.maxUses, 10) : undefined,
        isActive: b.isActive === 'on' || b.isActive === 'true',
        expiresAt: b.expiresAt || undefined,
      };
      Object.keys(dto).forEach((k) => { if (dto[k] === undefined) delete dto[k]; });

      await this.couponsService.create(dto);
      session.flash = { type: 'success', message: `Coupon "${dto.code}" created` };
      res.redirect('/admin/coupons');
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to create coupon' };
      res.redirect('/admin/coupons/new');
    }
  }

  @Get(':id/edit')
  async editForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const coupons = await this.couponsService.findAll();
    const coupon = coupons.find((c) => c.id === id);
    if (!coupon) {
      session.flash = { type: 'error', message: 'Coupon not found' };
      return res.redirect('/admin/coupons');
    }

    res.render('coupons/form', {
      admin: session.adminUser,
      flash,
      coupon,
      currentPage: 'coupons',
      pageTitle: 'Edit Coupon',
    });
  }

  @Post(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      const b = req.body;
      const dto: any = {};
      if (b.code?.trim()) dto.code = b.code.trim();
      if (b.type) dto.type = b.type;
      if (b.value) dto.value = parseFloat(b.value);
      if (b.minOrder !== undefined) dto.minOrder = b.minOrder ? parseFloat(b.minOrder) : null;
      if (b.maxUses !== undefined) dto.maxUses = b.maxUses ? parseInt(b.maxUses, 10) : null;
      dto.isActive = b.isActive === 'on' || b.isActive === 'true';
      if (b.expiresAt !== undefined) dto.expiresAt = b.expiresAt || null;

      await this.couponsService.update(id, dto);
      session.flash = { type: 'success', message: 'Coupon updated' };
      res.redirect('/admin/coupons');
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to update coupon' };
      res.redirect(`/admin/coupons/${id}/edit`);
    }
  }

  @Post(':id/delete')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      await this.couponsService.remove(id);
      session.flash = { type: 'success', message: 'Coupon deleted' };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to delete coupon' };
    }
    res.redirect('/admin/coupons');
  }
}
