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
import { CategoriesService } from '../categories/categories.service.js';
import { ProductsService } from '../products/products.service.js';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

@UseGuards(AdminAuthGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    // Two parallel queries instead of N+1: one for categories, one for all counts
    const [categories, productCounts] = await Promise.all([
      this.categoriesService.findAll(),
      this.productsService.countByCategory(),
    ]);

    res.render('categories/list', {
      admin: session.adminUser,
      flash,
      categories,
      productCounts, // { categoryId: count } map
      currentPage: 'categories',
    });
  }

  @Get('new')
  async newForm(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    res.render('categories/form', {
      admin: session.adminUser,
      flash,
      category: null,
      currentPage: 'categories',
      pageTitle: 'Add Category',
    });
  }

  @Post()
  async create(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    try {
      const { name, slug, description, image, sortOrder } = req.body;
      const dto: any = {
        name: name?.trim(),
        slug: slug?.trim() || slugify(name || ''),
        description: description?.trim() || undefined,
        image: image?.trim() || undefined,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      };
      // Remove undefined keys
      Object.keys(dto).forEach((k) => { if (dto[k] === undefined) delete dto[k]; });

      await this.categoriesService.create(dto);
      session.flash = { type: 'success', message: `Category "${dto.name}" created` };
      res.redirect('/admin/categories');
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to create category' };
      res.redirect('/admin/categories/new');
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

    const category = await this.categoriesService.findOne(id);
    res.render('categories/form', {
      admin: session.adminUser,
      flash,
      category,
      currentPage: 'categories',
      pageTitle: 'Edit Category',
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
      const { name, slug, description, image, sortOrder } = req.body;
      const dto: any = {};
      if (name?.trim()) dto.name = name.trim();
      if (slug?.trim()) dto.slug = slug.trim();
      if (description !== undefined) dto.description = description.trim() || null;
      if (image !== undefined) dto.image = image.trim() || null;
      if (sortOrder !== undefined && sortOrder !== '') dto.sortOrder = parseInt(sortOrder, 10);

      await this.categoriesService.update(id, dto);
      session.flash = { type: 'success', message: 'Category updated' };
      res.redirect('/admin/categories');
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to update category' };
      res.redirect(`/admin/categories/${id}/edit`);
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
      await this.categoriesService.remove(id);
      session.flash = { type: 'success', message: 'Category deleted' };
    } catch (err: any) {
      // The FK constraint (RESTRICT) throws when category has products.
      // TypeORM wraps the Postgres error — check for the constraint violation code.
      const msg = err.message || '';
      if (msg.includes('violates foreign key') || msg.includes('RESTRICT') || err.code === '23503') {
        session.flash = {
          type: 'error',
          message: 'Cannot delete: this category has products. Reassign or remove them first.',
        };
      } else {
        session.flash = { type: 'error', message: msg || 'Failed to delete category' };
      }
    }
    res.redirect('/admin/categories');
  }
}
