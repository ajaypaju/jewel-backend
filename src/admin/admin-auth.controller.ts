import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import * as express from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('login')
  getLogin(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    if (session?.adminUser) {
      return res.redirect('/admin');
    }
    const flash = session?.flash;
    if (session) session.flash = null;
    res.render('login', { error: flash?.type === 'error' ? flash.message : null });
  }

  @Post('login')
  async postLogin(@Req() req: express.Request, @Res() res: express.Response) {
    const { email, password } = req.body;
    const session = (req as any).session;

    if (!email || !password) {
      return res.render('login', { error: 'Email and password are required' });
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    if (user.role !== 'admin') {
      return res.render('login', { error: 'Access denied. Admin privileges required.' });
    }

    session.adminUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.redirect('/admin');
  }

  @Post('logout')
  postLogout(@Req() req: express.Request, @Res() res: express.Response) {
    const session = (req as any).session;
    session.destroy(() => {
      res.redirect('/admin/login');
    });
  }
}
