import { IsString, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  orderId: string;

  @IsString()
  dealerId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  contractValue: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
