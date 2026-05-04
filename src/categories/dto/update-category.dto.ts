import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto.js';

// PartialType takes CreateCategoryDto and makes every field optional.
// So for updates, you can send just { name: "New Name" } or just { sortOrder: 3 }
// without needing to repeat all the validation decorators.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
