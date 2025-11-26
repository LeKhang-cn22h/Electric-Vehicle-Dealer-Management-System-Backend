// src/dto/process-vehicle-request.dto.ts
export class ProcessVehicleRequestDto {
  id: number;
  status: 'approved' | 'rejected' | 'processing';
  notes?: string;
  assigned_staff_id?: string;
  estimated_delivery_date?: Date;
}
