import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateTestDriveSlotDto {
  @IsInt()
  vehicle_id: number;

  @IsDateString()
  slot_start: string;

  @IsDateString()
  slot_end: string;

  @IsOptional()
  @IsInt()
  max_customers?: number;

  @IsOptional()
  @IsString()
  status?: string; // default: available
}
