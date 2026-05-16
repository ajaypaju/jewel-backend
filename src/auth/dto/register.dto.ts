import { IsString, IsEmail, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
