import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';

// @Module bundles everything related to categories:
// - TypeOrmModule.forFeature registers the Category entity's Repository
//   so it can be injected with @InjectRepository(Category) in the service
// - controllers: HTTP route handlers
// - providers: services (business logic), injected via DI
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // available to other modules that import CategoriesModule
})
export class CategoriesModule {}
