import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix — all routes start with /api
  app.setGlobalPrefix('api');

  // CORS — allow the frontend dev server to make requests
  app.enableCors({
    origin: 'http://localhost:8080',
  });

  // Global validation pipe — auto-validates incoming DTOs
  // whitelist: strips properties not in the DTO
  // forbidNonWhitelisted: throws error if unknown properties are sent
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api`);
}
bootstrap();
