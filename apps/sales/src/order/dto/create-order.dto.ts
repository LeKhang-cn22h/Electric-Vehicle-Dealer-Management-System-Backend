import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @IsUUID()
  createdBy: string;

  // Payment
  @IsEnum(['cash', 'bank_transfer'])
  paymentMethod: 'cash' | 'bank_transfer';

  @IsEnum(['unpaid', 'paid', 'partial'])
  paymentStatus: 'unpaid' | 'paid' | 'partial';

  @IsNumber()
  paymentAmount: number;

  @IsString()
  @IsOptional()
  bank: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  term: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  downPayment: number;
}
