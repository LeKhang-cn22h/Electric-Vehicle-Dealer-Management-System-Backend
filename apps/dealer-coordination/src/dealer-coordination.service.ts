// //apps/dealer-coordination/src/dealer-coordination.service.ts
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { SupabaseService } from './supabase/supabase.service'; // import service bạn vừa viết
// import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
// import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

// @Injectable()
// export class DealerCoordinationService implements OnModuleInit {
//   private client!: ClientProxy;

//   constructor(
//     private configService: ConfigService,
//     private supabaseService: SupabaseService, // inject service
//   ) {}

//   onModuleInit() {
//     this.client = ClientProxyFactory.create({
//       transport: Transport.RMQ,
//       options: {
//         urls: [this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
//         queue: 'vehicle_request_queue',
//         queueOptions: { durable: false },
//       },
//     });
//   }

//   // ======================
//   // CREATE REQUEST (NEW)
//   // ======================
//   async createVehicleRequest(dto: CreateVehicleRequestDto, auth: string): Promise<any> {
//     console.log('=== DEBUG ===');
//     console.log('dto:', dto);
//     console.log('auth:', auth);

//     const { dealer_name, email, address, quantity } = dto;

//     try {
//       const user = await this.supabaseService.getUserFromToken(auth);
//       console.log('user:', user);

//       const user_id = user?.id || null;
//       console.log('user_id:', user_id);

//       const { data: request, error } = await this.supabaseService
//         .getClient()
//         .schema('evm_coordination')
//         .from('vehicle_requests')
//         .insert({
//           dealer_name,
//           email,
//           address,
//           quantity,
//           status,
//           user_id,
//         })
//         .select()
//         .single();

//       console.log('insert result:', { request, error });

//       if (error) {
//         throw new Error(`Failed to create vehicle request: ${error.message}`);
//       }

//       this.client.emit('vehicle_request_created', request);

//       return { request };
//     } catch (err) {
//       console.error('=== ERROR ===', err);
//       throw err;
//     }
//   }
//   async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
//     const { data, error } = await this.supabaseService
//       .getClient()
//       .schema('evm_coordination')
//       .from('vehicle_requests')
//       .select('*')
//       .ilike('dealer_name', dealer_name ? `%${dealer_name}%` : '%');

//     if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
//     return data || [];
//   }
//   // dealer-coordination.service.ts

//   // Thêm 2 methods này nếu chưa có
//   async getAllVehicleRequests(): Promise<any[]> {
//     const { data, error } = await this.supabaseService
//       .getClient()
//       .schema('evm_coordination')
//       .from('vehicle_requests')
//       .select('*');

//     if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
//     return data || [];
//   }
// }
//apps/dealer-coordination/src/dealer-coordination.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase/supabase.service';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

@Injectable()
export class DealerCoordinationService implements OnModuleInit {
  private client!: ClientProxy;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {}

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

  // ======================
  // CREATE REQUEST (FIXED)
  // ======================
  async createVehicleRequest(dto: CreateVehicleRequestDto, auth: string): Promise<any> {
    console.log('=== DEBUG ===');
    console.log('dto:', dto);
    console.log('auth:', auth);

    const { dealer_name, email, address, quantity } = dto;

    try {
      const user = await this.supabaseService.getUserFromToken(auth);
      console.log('user:', user);

      const user_id = user?.id || null;
      console.log('user_id:', user_id);

      // THÊM: Khởi tạo status mặc định
      const status = 'pending'; // Thêm dòng này

      const { data: request, error } = await this.supabaseService
        .getClient()
        .schema('evm_coordination')
        .from('vehicle_requests')
        .insert({
          dealer_name,
          email,
          address,
          quantity,
          status, // Đã có giá trị
          user_id,
          created_at: new Date().toISOString(), // Thêm timestamp
          updated_at: new Date().toISOString(), // Thêm timestamp
        })
        .select()
        .single();

      console.log('insert result:', { request, error });

      if (error) {
        throw new Error(`Failed to create vehicle request: ${error.message}`);
      }

      this.client.emit('vehicle_request_created', request);

      return { request };
    } catch (err) {
      console.error('=== ERROR ===', err);
      throw err;
    }
  }

  // ======================
  // GET REQUESTS BY DEALER NAME
  // ======================
  async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
    let query = this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*');

    // THÊM: Filter theo dealer_name nếu có
    if (dealer_name) {
      query = query.ilike('dealer_name', `%${dealer_name}%`);
    }

    // THÊM: Sắp xếp theo thời gian tạo mới nhất
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
    return data || [];
  }

  // ======================
  // GET ALL VEHICLE REQUESTS
  // ======================
  async getAllVehicleRequests(): Promise<any[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*')
      .order('created_at', { ascending: false }); // THÊM: Sắp xếp

    if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
    return data || [];
  }

  // ======================
  // NEW: GET REQUESTS BY STATUS
  // ======================
  async getVehicleRequestsByStatus(status: string): Promise<any[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get vehicle requests by status: ${error.message}`);
    return data || [];
  }

  // ======================
  // NEW: UPDATE REQUEST STATUS
  // ======================
  async updateRequestStatus(requestId: number, status: string): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .update({
        status,
        updated_at: new Date().toISOString(), // Cập nhật thời gian
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update request status: ${error.message}`);

    // Emit event khi status thay đổi
    this.client.emit('vehicle_request_status_updated', data);

    return data;
  }

  // ======================
  // NEW: GET REQUEST BY ID
  // ======================
  async getVehicleRequestById(id: number, currentUserId: string): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', currentUserId)
      .single();

    if (error) throw new Error(`Failed to get vehicle request: ${error.message}`);
    return data;
  }
}
