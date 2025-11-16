import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  quotationId?: string;

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

  // Payment
  @IsEnum(['cash', 'bank_transfer', 'card'])
  paymentMethod: 'cash' | 'bank_transfer' | 'card';

  @IsEnum(['unpaid', 'paid', 'partial'])
  paymentStatus: 'unpaid' | 'paid' | 'partial';

  @IsNumber()
  paymentAmount: number;
}
