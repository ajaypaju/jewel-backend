import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './guards/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Login returns 200, not 201
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Stateless logout: the server doesn't track tokens, so "logout" is just
  // the client discarding the token. This endpoint exists for API completeness
  // so the frontend has something to call. Token invalidation would require
  // a blacklist/Redis — overkill for now.
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out successfully' };
  }

  // GET /api/auth/me — canonical endpoint for getting the current user.
  // The frontend analysis shows both /api/auth/me and /api/users/me —
  // both work, users controller also has a /me route.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
