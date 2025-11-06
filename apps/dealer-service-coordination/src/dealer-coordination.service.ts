import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DealerCoordinationService {
  private readonly supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    // FIX: Sử dụng type assertion
    this.supabase = createClient(supabaseUrl!, supabaseKey!) as SupabaseClient;
  }

  async createVehicleRequest(
    dealerId: string,
    vehicleId: string,
    quantity: number,
    note: string,
    requestType: string, // ✅ thêm tham số này
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from('vehicle_requests')
      .insert([
        {
          dealer_id: dealerId,
          vehicle_id: vehicleId,
          quantity,
          note,
          request_type: requestType, // ✅ thêm dòng này
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }
}
