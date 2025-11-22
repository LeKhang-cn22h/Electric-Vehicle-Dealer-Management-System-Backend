import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';

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
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
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
