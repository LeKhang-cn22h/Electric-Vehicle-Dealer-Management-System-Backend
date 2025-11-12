// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';

// @Injectable()
// export class DealerCoordinationService {
//   private readonly supabase: SupabaseClient;

//   constructor(private configService: ConfigService) {
//     const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
//     const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

//     // FIX: Sử dụng type assertion
//     this.supabase = createClient(supabaseUrl!, supabaseKey!) as SupabaseClient;
//   }

//   async createVehicleRequest(
//     dealerId: string,
//     vehicleId: string,
//     quantity: number,
//     note: string,
//     requestType: string,
//   ): Promise<any> {
//     const { data, error } = await this.supabase
//       .from('distribution.vehicle_dispatch_requests')
//       // .schema('distribution') // FIX: Chỉ định schema đúng cách
//       .insert([
//         {
//           dealer_id: dealerId,
//           vehicle_id: vehicleId,
//           quantity,
//           note,
//           request_type: requestType, // ✅ thêm dòng này
//           status: 'pending',
//           created_at: new Date().toISOString(),
//         },
//       ])
//       .select();

//     if (error) {
//       throw new Error(error.message);
//     }

//     return data[0];
//   }
// }
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';

// @Injectable()
// export class DealerCoordinationService {
//   private readonly supabase: SupabaseClient;

//   constructor(private configService: ConfigService) {
//     const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
//     const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
//     this.supabase = createClient(supabaseUrl!, supabaseKey!);
//   }

//   async createVehicleRequest(
//     dealerId: string,
//     vehicleId: string,
//     quantity: number,
//     requestType: string,
//     note: string,
//   ): Promise<any> {
//     const { data, error } = await this.supabase.rpc('create_vehicle_dispatch_request', {
//       // Gọi function RPC
//       p_dealer_id: dealerId,
//       p_vehicle_id: vehicleId,
//       p_quantity: quantity,
//       p_request_type: requestType,
//       p_note: note,
//     });

//     if (error) {
//       console.error('Supabase RPC error:', error);
//       throw new Error(`Failed to create vehicle request: ${error.message}`);
//     }

//     return data;
//   }

// }
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DealerCoordinationService {
  private readonly supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  async createVehicleRequest(
    dealer_name: string, // ✅ Đổi từ dealerId thành dealer_name
    vehicle_model: string, // ✅ Đổi từ vehicleId thành vehicle_model
    quantity: number,
    request_type: string, // ✅ Đổi từ requestType thành request_type
    note?: string, // ✅ Thêm dấu ? vì optional
  ): Promise<any> {
    const { data, error } = await this.supabase
      .from('vehicle_dispatch_requests')
      .insert([
        {
          dealer_name, // ✅ Sử dụng dealer_name thay vì dealer_id
          vehicle_model, // ✅ Sử dụng vehicle_model thay vì vehicle_id
          quantity,
          request_type, // ✅ Sử dụng request_type
          note: note || null, // ✅ Xử lý optional
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create vehicle request: ${error.message}`);
    }

    return data[0];
  }

  // ✅ Thêm method để lấy lịch sử requests
  async getVehicleRequests(dealer_name?: string): Promise<any[]> {
    let query = this.supabase
      .from('vehicle_dispatch_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (dealer_name) {
      query = query.eq('dealer_name', dealer_name);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get vehicle requests: ${error.message}`);
    }

    return data || [];
  }
}
