import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsInt()
  customer_uid?: string;

  @IsOptional()
  @IsInt()
  test_drive_slot_id?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
