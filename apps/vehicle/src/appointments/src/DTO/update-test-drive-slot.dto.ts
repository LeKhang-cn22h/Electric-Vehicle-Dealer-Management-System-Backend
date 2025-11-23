import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateTestDriveSlotDto {
  @IsOptional()
  @IsInt()
  vehicle_id?: number;

  @IsOptional()
  @IsDateString()
  slot_start?: string;

  @IsOptional()
  @IsDateString()
  slot_end?: string;

  @IsOptional()
  @IsInt()
  max_customers?: number;

  @IsOptional()
  @IsInt()
  booked_customers?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
