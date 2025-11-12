import { IsString, IsArray, IsNumber, ValidateNested, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class QuotationItemDto {
  @IsUUID()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}

export class CreateQuotationDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  createdBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @IsOptional()
  @IsString()
  note?: string;
}
