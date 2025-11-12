import { IsOptional, IsString } from 'class-validator';

export class ListBillsDto {
  @IsOptional()
  @IsString()
  dealer_id?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;
}
