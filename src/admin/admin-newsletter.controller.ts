import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';
import { NewsletterService } from '../newsletter/newsletter.service.js';

@UseGuards(AdminAuthGuard)
@Controller('admin/newsletter')
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get()
  async list(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    const flash = session?.flash;
    if (session) session.flash = null;

    const subscribers = await this.newsletterService.findAll();

    res.render('newsletter/list', {
      admin: session.adminUser,
      flash,
      subscribers,
      currentPage: 'newsletter',
    });
  }
}
