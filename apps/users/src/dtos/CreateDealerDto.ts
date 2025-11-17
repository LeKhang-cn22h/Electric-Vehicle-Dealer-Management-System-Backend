import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateDealerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsEmail()
  user_email: string;

  @MinLength(6)
  user_password: string;

  @IsOptional()
  @IsString()
  user_full_name?: string;

  @IsOptional()
  @IsString()
  user_phone?: string;
}
