import { IsString, IsOptional, IsUrl, MinLength } from 'class-validator';

// Deliberately NOT using PartialType(CreateUserDto) because we don't want
// password or email to be updatable through the profile endpoint.
// Email changes need verification, password has its own change-password flow.
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
