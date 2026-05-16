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
import { ReviewsService } from '../reviews/reviews.service.js';

@UseGuards(AdminAuthGuard)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const page = parseInt((req.query as any).page as string, 10) || 1;
    const result = await this.reviewsService.findAllAdmin(page, 20);

    res.render('reviews/list', {
      admin: session.adminUser,
      flash,
      reviews: result.reviews,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      currentPage: 'reviews',
    });
  }

  // Toggle isApproved — reuses ReviewsService.moderate which also
  // recomputes the product rating automatically (via updateProductRating)
  @Post(':id/moderate')
  async moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      const isApproved = req.body.isApproved === 'true';
      await this.reviewsService.moderate(id, isApproved);
      session.flash = { type: 'success', message: `Review ${isApproved ? 'approved' : 'hidden'}` };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to moderate review' };
    }
    res.redirect('/admin/reviews');
  }

  @Post(':id/delete')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const session = (req as any).session;
    try {
      // isAdmin=true so the service skips ownership check
      await this.reviewsService.remove('', id, true);
      session.flash = { type: 'success', message: 'Review deleted' };
    } catch (err: any) {
      session.flash = { type: 'error', message: err.message || 'Failed to delete review' };
    }
    res.redirect('/admin/reviews');
  }
}
