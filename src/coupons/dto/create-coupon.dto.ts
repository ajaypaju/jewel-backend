import {
  IsString,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsString()
  @IsIn(['percent', 'fixed'])
  type: string;

  @IsNumber()
  @Min(0.01)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
