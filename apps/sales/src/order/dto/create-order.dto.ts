import { IsUUID, IsNumber, IsArray, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  quotationId: string;

  @IsUUID()
  customerId: string;

  @IsUUID()
  createdBy: string;

  @IsArray()
  items: any[];

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  status: string = 'pending';
}
