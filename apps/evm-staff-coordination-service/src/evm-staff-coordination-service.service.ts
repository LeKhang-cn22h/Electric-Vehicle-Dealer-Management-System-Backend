import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClientProxy } from '@nestjs/microservices';
interface VehicleResponseItem {
  request_item_id: string;
  response_status: string;
  response_note?: string;
}

@Injectable()
export class EvmStaffCoordinationService {
  private readonly supabase: SupabaseClient;

    // Lưu vào Supabase
    const { data, error } = await supabase
      .schema('evm_coordination')
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
  constructor(
    private configService: ConfigService,
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    // console.log('SUPABASE_URL:', supabaseUrl);
    // console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey);
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  /**
   * Tạo phản hồi tổng kèm các item chi tiết cho một request
   */
  async createVehicleResponse(
    request_id: string,
    staff_id: string,
    staff_name: string,
    response_status: string,
    response_note: string | null,
    items: VehicleResponseItem[],
  ): Promise<any> {
    // 1. Tạo phản hồi tổng
    const { data: response, error: respError } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_responses')
      .insert({
        request_id,
        staff_id,
        staff_name,
        response_status,
        response_note,
      })
      .select('*')
      .single();

    if (respError) throw new Error(`Failed to create vehicle response: ${respError.message}`);

    // 2. Tạo các item chi tiết phản hồi
    const itemsToInsert = items.map((item) => ({
      response_id: response.id,
      request_item_id: item.request_item_id,
      response_status: item.response_status,
      response_note: item.response_note || null,
    }));

    const { error: itemsError } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_response_items')
      .insert(itemsToInsert);

    if (itemsError) throw new Error(`Failed to create response items: ${itemsError.message}`);

    // 3. Gửi message qua RabbitMQ thông báo đã tạo phản hồi mới
    await this.client.emit('vehicle_response_created', {
      response,
      items: itemsToInsert,
    });

    return { response, items: itemsToInsert };
  }

  /**
   * Cập nhật trạng thái phản hồi tổng và lưu lịch sử
   */
  async updateResponseStatus(
    response_id: string,
    new_status: string,
    note?: string,
    action_by = 'system',
  ): Promise<any> {
    // Lấy trạng thái cũ
    const { data: existing, error: getErr } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_responses')
      .select('response_status')
      .eq('id', response_id)
      .single();

    if (getErr) throw new Error(`Failed to get existing response: ${getErr.message}`);

    const old_status = existing.response_status;

    // Cập nhật trạng thái mới
    const { data: updated, error: updErr } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_responses')
      .update({ response_status: new_status })
      .eq('id', response_id)
      .select('*')
      .single();

    if (updErr) throw new Error(`Failed to update response status: ${updErr.message}`);

    // Lưu lịch sử thay đổi trạng thái
    const { error: histErr } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_response_history')
      .insert({
        response_id,
        action_by,
        old_status,
        new_status,
        note: note || null,
      });

    if (histErr) throw new Error(`Failed to save response history: ${histErr.message}`);

    return updated;
  }

  /**
   * Lấy phản hồi tổng, lịch sử, và các item chi tiết theo response_id
   */
  async getResponseByIdWithDetails(response_id: string): Promise<any> {
    const { data: response, error: respErr } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_responses')
      .select('*')
      .eq('id', response_id)
      .single();

    if (respErr) throw new Error(`Failed to get response: ${respErr.message}`);

    const { data: history, error: histErr } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_response_history')
      .select('*')
      .eq('response_id', response_id);

    if (histErr) throw new Error(`Failed to get response history: ${histErr.message}`);

    const { data: items, error: itemsErr } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_dispatch_response_items')
      .select('*')
      .eq('response_id', response_id);

    if (itemsErr) throw new Error(`Failed to get response items: ${itemsErr.message}`);

    return { response, history, items };
  }
}
