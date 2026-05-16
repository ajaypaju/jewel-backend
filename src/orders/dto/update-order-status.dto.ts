import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'])
  status: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
