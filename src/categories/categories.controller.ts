import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

// @Controller('categories') means all routes in this class start with /categories.
// Combined with the global prefix '/api', the full base path is /api/categories.
@Controller('categories')
export class CategoriesController {
  // NestJS injects the CategoriesService automatically (dependency injection).
  constructor(private readonly categoriesService: CategoriesService) {}

  // POST /api/categories
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    // @Body() extracts the request body and validates it against CreateCategoryDto
    return this.categoriesService.create(dto);
  }

  // GET /api/categories
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // GET /api/categories/slug/:slug
  // IMPORTANT: This route must be defined BEFORE the :id route below,
  // otherwise NestJS would try to parse "slug" as a UUID and fail.
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // GET /api/categories/:id
  // ParseUUIDPipe validates that :id is a valid UUID — returns 400 if not.
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  // PATCH /api/categories/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  // DELETE /api/categories/:id
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
