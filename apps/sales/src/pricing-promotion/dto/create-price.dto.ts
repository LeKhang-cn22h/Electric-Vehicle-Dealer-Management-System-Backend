import { IsNumber, IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreatePriceDto {
  @IsString()
  productId: string;

  @IsNumber()
  basePrice: number;

  @IsNumber()
  discountedPrice: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
