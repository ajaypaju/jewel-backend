import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  size?: string;
}
