import { Injectable } from '@nestjs/common';
import { supabase } from './supabase.client';

export class CreateVehicleRequestDto {
  dealer_id: string = '';
  vehicle_id: string = '';
  quantity: number = 0;
  note?: string;
  request_type: string = '';
}

@Injectable()
export class EvmStaffCoordinationService {
  async handleRequest(dto: CreateVehicleRequestDto) {
    // Ví dụ logic duyệt: quantity <= 10 là duyệt
    const approved = dto.quantity <= 10;

    // Lưu vào Supabase
    const { data, error } = await supabase
      .from('staff_coordination_history') // tên table bạn tạo trong Supabase
      .insert([
        {
          dealer_id: dto.dealer_id,
          vehicle_id: dto.vehicle_id,
          quantity: dto.quantity,
          note: dto.note,
          request_type: dto.request_type,
          approved,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      throw new Error(error.message);
    }

    return { approved, data };
  }
}
