import { IsNumber, IsUUID } from 'class-validator';

export class CreatePriceDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  price: number;
}
