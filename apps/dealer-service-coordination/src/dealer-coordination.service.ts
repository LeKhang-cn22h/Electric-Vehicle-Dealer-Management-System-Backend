// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

// interface VehicleItem {
//   vehicle_id: string;
//   vehicle_model: string;
//   quantity: number;
//   note?: string;
// }

// @Injectable()
// export class DealerCoordinationService implements OnModuleInit {
//   private readonly supabase: SupabaseClient;
//   private client!: ClientProxy;

//   constructor(private configService: ConfigService) {
//     const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
//     const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
//     this.supabase = createClient(supabaseUrl!, supabaseKey!);
//   }
//   onModuleInit() {
//     this.client = ClientProxyFactory.create({
//       transport: Transport.RMQ,
//       options: {
//         urls: [this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
//         queue: 'vehicle_request_queue',
//         queueOptions: {
//           durable: false,
//         },
//       },
//     });
//   }
//   async createVehicleRequest(
//     dealer_id: string,
//     dealer_name: string,
//     request_type: string,
//     vehicles: VehicleItem[],
//     // action_by = 'system',
//   ): Promise<any> {
//     // 1. Tạo request tổng
//     const { data: request, error: reqError } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_requests')
//       .insert({
//         dealer_id,
//         dealer_name,
//         request_type,
//         status: 'pending',
//       })
//       .select('*')
//       .single();

//     if (reqError) throw new Error(`Failed to create vehicle request: ${reqError.message}`);
//     for (const v of vehicles) {
//       if (!v.vehicle_model || v.vehicle_model.trim() === '') {
//         throw new Error('vehicle_model is required for every vehicle item.');
//       }
//     }
//     // 2. Tạo các item chi tiết
//     const itemsToInsert = vehicles.map((v) => ({
//       request_id: request.id,
//       vehicle_id: v.vehicle_id,
//       vehicle_model: v.vehicle_model,
//       quantity: v.quantity,
//       note: v.note || null,
//     }));

//     const { error: itemsError } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_request_items')
//       .insert(itemsToInsert);

//     if (itemsError)
//       throw new Error(`Failed to create vehicle request items: ${itemsError.message}`);
//     // 3. Gửi message lên RabbitMQ
//     this.client.emit('vehicle_request_created', {
//       request,
//       items: itemsToInsert,
//     });
//     // 4. (Tuỳ chọn) Lưu lịch sử hoặc trả về dữ liệu
//     return { request, items: itemsToInsert };
//   }

//   /**
//    * Cập nhật trạng thái request + lưu lịch sử
//    */
//   async updateRequestStatus(
//     request_id: string,
//     status: string,
//     note?: string,
//     action_by = 'system',
//   ): Promise<any> {
//     // 1. Update trực tiếp
//     const { data: updated, error: updError } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_requests')
//       .update({ status, note: note || null })
//       .eq('id', request_id)
//       .select('*')
//       .single();

//     if (updError) throw new Error(`Failed to update request status: ${updError.message}`);

//     // 2. Insert vào lịch sử
//     const { error: histError } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_request_history')
//       .insert({
//         request_id: updated.id,
//         dealer_id: updated.dealer_id,
//         dealer_name: updated.dealer_name,
//         // vehicle_id: updated.vehicle_id,
//         // vehicle_model: updated.vehicle_model,
//         // quantity: updated.quantity,
//         request_type: updated.request_type,
//         note: updated.note,
//         status: updated.status,
//         action_by,
//       });

//     if (histError) throw new Error(`Failed to save request history: ${histError.message}`);

//     return updated;
//   }

//   /**
//    * Lấy request + lịch sử theo request_id
//    */
//   async getVehicleRequestByIdWithHistory(request_id: string): Promise<any> {
//     const { data: request, error: reqError } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_requests')
//       .select('*')
//       .eq('id', request_id)
//       .single();

//     if (reqError) throw new Error(`Failed to get request: ${reqError.message}`);

//     const { data: history, error: histError } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_request_history')
//       .select('*')
//       .eq('request_id', request_id);

//     if (histError) throw new Error(`Failed to get request history: ${histError.message}`);

//     return { ...request, history };
//   }

//   /**
//    * Lấy tất cả request theo dealer_id
//    */
//   async getVehicleRequestsByDealerId(dealer_id: string): Promise<any[]> {
//     const { data, error } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_requests')
//       .select('*')
//       .eq('dealer_id', dealer_id);

//     if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
//     return data || [];
//   }

//   /**
//    * Lấy tất cả request theo dealer_name
//    */
//   async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
//     const { data, error } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_requests')
//       .select('*')
//       .ilike('dealer_name', dealer_name || '%');

//     if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
//     return data || [];
//   }

//   /**
//    * Lấy tất cả requests
//    */
//   async getAllVehicleRequests(): Promise<any[]> {
//     const { data, error } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_dispatch_requests')
//       .select('*');

//     if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
//     return data || [];
//   }
// }
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

interface VehicleItem {
  vehicle_id: string;
  vehicle_model: string;
  quantity: number;
  note?: string;
}

@Injectable()
export class DealerCoordinationService implements OnModuleInit {
  private readonly supabase: SupabaseClient;
  private client!: ClientProxy;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(supabaseUrl!, supabaseKey!);
  }

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
        queue: 'vehicle_request_queue',
        queueOptions: { durable: false },
      },
    });
  }

  async createVehicleRequest(
    dealer_id: string,
    dealer_name: string,
    request_type: string,
    vehicles: VehicleItem[],
  ): Promise<any> {
    // 1. Tạo request cha
    const { data: request, error: reqError } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_requests')
      .insert({
        dealer_id,
        dealer_name,
        request_type,
      })
      .select()
      .single();

    if (reqError) {
      throw new Error(`Failed to create vehicle request: ${reqError.message}`);
    }

    // 2. Validate vehicle model
    for (const v of vehicles) {
      if (!v.vehicle_model || v.vehicle_model.trim() === '') {
        throw new Error('vehicle_model is required for every vehicle item.');
      }
    }

    // 3. Insert items
    const itemsToInsert = vehicles.map((v) => ({
      request_id: request.id,
      vehicle_id: v.vehicle_id,
      vehicle_model: v.vehicle_model,
      quantity: v.quantity,
      note: v.note || null,
    }));

    const { error: itemsError } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_request_items')
      .insert(itemsToInsert);

    if (itemsError) {
      throw new Error(`Failed to create vehicle request items: ${itemsError.message}`);
    }

    // 4. Emit RMQ event
    this.client.emit('vehicle_request_created', {
      request,
      items: itemsToInsert,
    });

    return { request, items: itemsToInsert };
  }

  // --- QUERY ---
  async getVehicleRequestsByDealerId(dealer_id: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*')
      .eq('dealer_id', dealer_id);

    if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
    return data || [];
  }

  async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*')
      .ilike('dealer_name', dealer_name || '%');

    if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
    return data || [];
  }

  async getAllVehicleRequests(): Promise<any[]> {
    const { data, error } = await this.supabase
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*');

    if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
    return data || [];
  }
}
