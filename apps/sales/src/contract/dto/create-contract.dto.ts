import { IsString, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateContractDto {
  @IsUUID()
  orderId: string;

  @IsString()
  dealerId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
