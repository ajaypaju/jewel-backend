import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
  Min,
  MinLength,
  Matches,
} from 'class-validator';

// This class defines what fields are accepted when creating a category.
// The ValidationPipe checks every incoming request body against these rules.
// If a rule fails, NestJS returns a 400 with a clear error message automatically.
export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  // Must be kebab-case: lowercase letters, numbers, and hyphens only
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case (e.g. "gold-rings")',
  })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
