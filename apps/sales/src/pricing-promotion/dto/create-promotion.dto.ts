import { IsString, IsOptional, IsNumber, IsIn, IsDateString, IsBoolean } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['percent', 'amount'])
  discountType: 'percent' | 'amount';

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePromotionDto extends CreatePromotionDto {}
