import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateContractDto {
  @IsString()
  contractNumber: string;

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
