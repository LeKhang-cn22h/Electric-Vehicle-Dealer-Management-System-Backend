import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  discountPercent: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
