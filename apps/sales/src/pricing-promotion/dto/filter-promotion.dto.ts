import { IsNumber, Min } from 'class-validator';

export class FilterPromotionDto {
  @IsNumber()
  @Min(0)
  minOrderValue: number;

  @IsNumber()
  @Min(0)
  minQuantity: number;
}

export class UpdateFilterPromotionDto extends FilterPromotionDto {}
