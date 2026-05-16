import { IsString, IsIn } from 'class-validator';

export class SetRoleDto {
  @IsString()
  @IsIn(['user', 'admin'])
  role: string;
}
