export class UpdateAppointmentDto {
  appointment_time?: string;
  status?: 'pending' | 'confirmed' | 'canceled' | 'done';
  notes?: string;
}
