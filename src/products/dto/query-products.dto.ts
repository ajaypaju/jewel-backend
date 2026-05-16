import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProductSortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price-asc',
  PRICE_DESC = 'price-desc',
  NAME = 'name',
}

export class QueryProductsDto {
  // Filter by category slug (e.g. ?categorySlug=rings)
  @IsOptional()
  @IsString()
  categorySlug?: string;

  // Filter by sale status — query params arrive as strings,
  // so Transform converts "true"/"false" strings to actual booleans.
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isOnSale?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isNewArrival?: boolean;

  // Price range filters — @Type(() => Number) converts the string "50" to number 50
  // before @IsNumber() validates it. This is needed because query params are always strings.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Full-text search across name, description, materials, tags
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
