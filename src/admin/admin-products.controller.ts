import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';
import { ProductsService } from '../products/products.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { productImageMulterOptions } from '../common/config/multer.config.js';

// Helper: generate kebab-case slug from a name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper: parse comma-separated string into array, filtering empty values
function parseArray(val: string | undefined): string[] | undefined {
  if (!val || !val.trim()) return undefined;
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

// Helper: coerce form data (all strings) into the shape ProductsService expects.
// HTML forms send everything as strings. Checkboxes send "on" when checked, absent when not.
// Number inputs send "123.45" as a string. This function normalizes all of that.
function parseProductForm(body: Record<string, any>) {
  const dto: Record<string, any> = {};

  dto.name = body.name?.trim();
  dto.slug = body.slug?.trim() || slugify(body.name || '');
  dto.description = body.description?.trim() || undefined;
  dto.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : undefined;
  dto.salePrice = body.salePrice ? parseFloat(body.salePrice) : undefined;
  dto.isOnSale = body.isOnSale === 'on' || body.isOnSale === 'true';
  dto.categoryId = body.categoryId || undefined;
  dto.sizes = parseArray(body.sizes);
  dto.materials = body.materials?.trim() || undefined;
  dto.weight = body.weight?.trim() || undefined;
  dto.stock = body.stock ? parseInt(body.stock, 10) : undefined;
  dto.sku = body.sku?.trim() || undefined;
  dto.isNewArrival = body.isNewArrival === 'on' || body.isNewArrival === 'true';
  dto.tags = parseArray(body.tags);

  // Remove undefined keys so PartialType update DTOs work correctly
  Object.keys(dto).forEach((k) => {
    if (dto[k] === undefined) delete dto[k];
  });

  return dto;
}

@UseGuards(AdminAuthGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // GET /admin/products — list with search, category filter, pagination
  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const query = req.query as any;
    const page = parseInt(query.page as string, 10) || 1;
    const search = (query.search as string) || '';
    const categorySlug = (query.category as string) || '';

    const [result, categories] = await Promise.all([
      this.productsService.findAllAdmin({ search, categorySlug, page, limit: 20 }),
      this.categoriesService.findAll(),
    ]);

    res.render('products/list', {
      admin: session.adminUser,
      flash,
      products: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      categories,
      search,
      categorySlug,
      currentPage: 'products',
    });
  }

  // GET /admin/products/new — create form
  @Get('new')
  async newForm(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const categories = await this.categoriesService.findAll();
    res.render('products/form', {
      admin: session.adminUser,
      flash,
      product: null,
      categories,
      currentPage: 'products',
      pageTitle: 'Add Product',
    });
  }

  // POST /admin/products — create product (multipart for images)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, productImageMulterOptions))
  async create(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const session = (req as any).session;
    try {
      const dto = parseProductForm(req.body);
      const product = await this.productsService.create(dto as any);

      // Upload images if provided
      if (files && files.length > 0) {
        const imageUrls = files.map((f) => `/uploads/products/${f.filename}`);
        await this.productsService.addImages(product.id, imageUrls);
      }

      session.flash = { type: 'success', message: `Product "${product.name}" created successfully` };
      res.redirect('/admin/products');
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to create product' };
      res.redirect('/admin/products/new');
    }
  }

  // GET /admin/products/:id/edit — edit form
  @Get(':id/edit')
  async editForm(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const [product, categories] = await Promise.all([
      this.productsService.findOneAdmin(id),
      this.categoriesService.findAll(),
    ]);

    res.render('products/form', {
      admin: session.adminUser,
      flash,
      product,
      categories,
      currentPage: 'products',
      pageTitle: 'Edit Product',
    });
  }

  // POST /admin/products/:id — update product (multipart for new images)
  @Post(':id')
  @UseInterceptors(FilesInterceptor('images', 10, productImageMulterOptions))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const session = (req as any).session;
    try {
      const dto = parseProductForm(req.body);

      // update uses findOne (active only) — for admin we need findOneAdmin.
      // But the service update checks slug/sku uniqueness which we want.
      // So we first verify the product exists, then use update logic directly.
      const product = await this.productsService.findOneAdmin(id);

      // Manually apply update logic (same as service.update but using admin find)
      Object.assign(product, dto);
      await this.productsService.update(id, dto as any);

      // Upload new images if provided
      if (files && files.length > 0) {
        const imageUrls = files.map((f) => `/uploads/products/${f.filename}`);
        await this.productsService.addImages(id, imageUrls);
      }

      session.flash = { type: 'success', message: `Product "${product.name}" updated successfully` };
      res.redirect('/admin/products');
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to update product' };
      res.redirect(`/admin/products/${id}/edit`);
    }
  }

  // POST /admin/products/:id/images/delete — remove one image
  @Post(':id/images/delete')
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      const { imageUrl } = req.body;
      await this.productsService.removeImage(id, imageUrl);
      session.flash = { type: 'success', message: 'Image removed' };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to remove image' };
    }
    res.redirect(`/admin/products/${id}/edit`);
  }

  // POST /admin/products/:id/delete — soft delete
  @Post(':id/delete')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      await this.productsService.remove(id);
      session.flash = { type: 'success', message: 'Product deactivated (soft deleted)' };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to delete product' };
    }
    res.redirect('/admin/products');
  }
}
