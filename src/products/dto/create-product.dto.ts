import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsInt,
  IsArray,
  Min,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case (e.g. "eternal-elegance-diamond-ring")',
  })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  originalPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  salePrice?: number;

  @IsOptional()
  @IsBoolean()
  isOnSale?: boolean;

  // The frontend sends a categoryId (UUID), not the full category object.
  // The service looks up the category and assigns the relation.
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
