import { IsString, IsNumber, IsUUID } from 'class-validator';

export class QuotationItemDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;
}
