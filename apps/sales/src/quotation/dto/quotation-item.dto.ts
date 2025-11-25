import { IsString, IsNumber, IsUUID } from 'class-validator';

export class QuotationItemDto {
  @IsNumber()
  id: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;
}
