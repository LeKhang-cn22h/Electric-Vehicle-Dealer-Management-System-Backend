// create-appointment.dto.ts
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  test_drive_slot_id: number;

  @IsOptional()
  @IsString()
  status?: string;
}
