import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface VehicleItem {
  vehicle_id: string;
  vehicle_model: string;
  quantity: number;
  note?: string;
}

@Injectable()
export class DealerCoordinationService {
  private readonly supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Tạo nhiều yêu cầu xe + lưu lịch sử trực tiếp vào bảng
   */
  // async createVehicleRequest(
  //   dealer_id: string,
  //   dealer_name: string,
  //   request_type: string,
  //   vehicles: VehicleItem[],
  //   action_by = 'system',
  // ): Promise<any[]> {
  //   const results = [];

  //   for (const v of vehicles) {
  //     // 1. Insert trực tiếp vào vehicle_dispatch_requests
  //     const { data: request, error: reqError } = await this.supabase
  //       .schema('distribution')
  //       .from('vehicle_dispatch_requests')
  //       // .from('distribution.vehicle_dispatch_requests')
  //       .insert({
  //         dealer_id,
  //         dealer_name,
  //         vehicle_id: v.vehicle_id,
  //         vehicle_model: v.vehicle_model,
  //         quantity: v.quantity,
  //         note: v.note || null,
  //         request_type,
  //         status: 'pending', // mặc định
  //       })
  //       .select('*')
  //       .single();

  //     if (reqError) throw new Error(`Failed to create vehicle request: ${reqError.message}`);

  //     // 2. Insert trực tiếp vào lịch sử
  //     const { error: histError } = await this.supabase
  //       .schema('distribution')
  //       .from('vehicle_dispatch_request_history')
  //       .insert({
  //         request_id: request.id,
  //         dealer_id: request.dealer_id,
  //         dealer_name: request.dealer_name,
  //         vehicle_id: request.vehicle_id,
  //         vehicle_model: request.vehicle_model,
  //         quantity: request.quantity,
  //         request_type: request.request_type,
  //         note: request.note,
  //         status: request.status,
  //         action_by,
  //       });

  //     if (histError) throw new Error(`Failed to save request history: ${histError.message}`);

  //     results.push(request);
  //   }

  //   return results;
  // }
  async createVehicleRequest(
    dealer_id: string,
    dealer_name: string,
    request_type: string,
    vehicles: VehicleItem[],
    // action_by = 'system',
  ): Promise<any> {
    // 1. Tạo request tổng
    const { data: request, error: reqError } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_requests')
      .insert({
        dealer_id,
        dealer_name,
        request_type,
        status: 'pending',
      })
      .select('*')
      .single();

    if (reqError) throw new Error(`Failed to create vehicle request: ${reqError.message}`);
    for (const v of vehicles) {
      if (!v.vehicle_model || v.vehicle_model.trim() === '') {
        throw new Error('vehicle_model is required for every vehicle item.');
      }
    }
    // 2. Tạo các item chi tiết
    const itemsToInsert = vehicles.map((v) => ({
      request_id: request.id,
      vehicle_id: v.vehicle_id,
      vehicle_model: v.vehicle_model,
      quantity: v.quantity,
      note: v.note || null,
    }));

    const { error: itemsError } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_request_items')
      .insert(itemsToInsert);

    if (itemsError)
      throw new Error(`Failed to create vehicle request items: ${itemsError.message}`);

    // 3. (Tuỳ chọn) Lưu lịch sử hoặc trả về dữ liệu
    return { request, items: itemsToInsert };
  }

  /**
   * Cập nhật trạng thái request + lưu lịch sử
   */
  async updateRequestStatus(
    request_id: string,
    status: string,
    note?: string,
    action_by = 'system',
  ): Promise<any> {
    // 1. Update trực tiếp
    const { data: updated, error: updError } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_requests')
      .update({ status, note: note || null })
      .eq('id', request_id)
      .select('*')
      .single();

    if (updError) throw new Error(`Failed to update request status: ${updError.message}`);

    // 2. Insert vào lịch sử
    const { error: histError } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_request_history')
      .insert({
        request_id: updated.id,
        dealer_id: updated.dealer_id,
        dealer_name: updated.dealer_name,
        // vehicle_id: updated.vehicle_id,
        // vehicle_model: updated.vehicle_model,
        // quantity: updated.quantity,
        request_type: updated.request_type,
        note: updated.note,
        status: updated.status,
        action_by,
      });

    if (histError) throw new Error(`Failed to save request history: ${histError.message}`);

    return updated;
  }

  /**
   * Lấy request + lịch sử theo request_id
   */
  async getVehicleRequestByIdWithHistory(request_id: string): Promise<any> {
    const { data: request, error: reqError } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (reqError) throw new Error(`Failed to get request: ${reqError.message}`);

    const { data: history, error: histError } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_request_history')
      .select('*')
      .eq('request_id', request_id);

    if (histError) throw new Error(`Failed to get request history: ${histError.message}`);

    return { ...request, history };
  }

  /**
   * Lấy tất cả request theo dealer_id
   */
  async getVehicleRequestsByDealerId(dealer_id: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_requests')
      .select('*')
      .eq('dealer_id', dealer_id);

    if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
    return data || [];
  }

  /**
   * Lấy tất cả request theo dealer_name
   */
  async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_requests')
      .select('*')
      .ilike('dealer_name', dealer_name || '%');

    if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
    return data || [];
  }

  /**
   * Lấy tất cả requests
   */
  async getAllVehicleRequests(): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('distribution')
      .from('vehicle_dispatch_requests')
      .select('*');

    if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
    return data || [];
  }
}
