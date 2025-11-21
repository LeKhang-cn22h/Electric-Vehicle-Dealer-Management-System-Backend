export class CreateAppointmentDto {
  admin_uid: number;
  customer_uid: number;
  vehicle_id: number;
  appointment_time: string;
  notes?: string;
}
