import { IsNumber, IsUUID, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreatePriceDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @Min(0)
  discountedPrice: number;

  @IsNumber()
  @Min(0)
  wholesalePrice: number;

  @IsNumber()
  @Min(0)
  quantity: number;
}
