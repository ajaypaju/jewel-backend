import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  // Global API prefix — all routes start with /api EXCEPT admin routes
  // Global API prefix for all routes EXCEPT admin panel
  // Admin routes are registered under /admin directly (no /api prefix)
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/admin', method: -1 as any },       // all methods on /admin
      { path: '/admin/*path', method: -1 as any },  // all methods on /admin/*
    ],
  });

  app.enableCors({
    origin: 'http://localhost:8080',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  // Session middleware for admin panel (httpOnly cookie)
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET', 'dev-secret'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  // EJS view engine for admin panel
  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(process.cwd(), 'src', 'admin', 'views'));

  // Serve admin static assets (CSS/JS) at /static/*
  // Using a dedicated prefix avoids collision with /admin EJS routes.
  // public/admin/admin.css → served at /static/admin/admin.css
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/static' });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api`);
  console.log(`Admin panel at http://localhost:${port}/admin`);
}
bootstrap();
