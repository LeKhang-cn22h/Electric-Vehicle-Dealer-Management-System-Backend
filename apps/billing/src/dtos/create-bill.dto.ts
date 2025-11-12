import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BillItemDto {
  @IsString()
  product_code: string;

  @IsString()
  description: string;

  @IsNotEmpty()
  qty: number;

  @IsNotEmpty()
  unit_price_cents: number;

  @IsString()
  tax_rate_code: string;
}

export class CreateBillDto {
  @IsString()
  customer_id: string;

  @IsString()
  dealer_id: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @IsOptional()
  meta?: Record<string, any>;

  @IsOptional()
  issue_now?: boolean;
}
