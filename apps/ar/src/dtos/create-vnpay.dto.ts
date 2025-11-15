import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateVnpayDto {
  @IsString()
  inv_id: string;

  @IsOptional()
  @IsEnum(['vn', 'en'])
  locale?: 'vn' | 'en';

  @IsOptional()
  @IsString()
  bankCode?: string;
}
