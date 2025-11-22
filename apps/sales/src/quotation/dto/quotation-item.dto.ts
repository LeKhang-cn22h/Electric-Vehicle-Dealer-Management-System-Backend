import { IsString, IsNumber, IsUUID } from 'class-validator';

export class QuotationItemDto {
  @IsString()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}
