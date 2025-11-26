// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
// import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

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
//         queueOptions: { durable: false },
//       },
//     });
//   }

//   // ======================
//   // CREATE REQUEST (NEW)
//   // ======================
//   async createVehicleRequest(dto: CreateVehicleRequestDto): Promise<any> {
//     const { dealer_name, email, address, quantity } = dto;

//     // INSERT request cha
//     const { data: request, error } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_requests')
//       .insert({
//         dealer_name,
//         email,
//         address,
//         quantity,
//       })
//       .select()
//       .single();

//     if (error) {
//       throw new Error(`Failed to create vehicle request: ${error.message}`);
//     }

//     // Emit event đến các service khác (nếu cần)
//     this.client.emit('vehicle_request_created', request);

//     return { request };
//   }

//   // ======================
//   // QUERY
//   // ======================
//   async getAllVehicleRequests(): Promise<any[]> {
//     const { data, error } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_requests')
//       .select('*');

//     if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
//     return data || [];
//   }

//   async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
//     const { data, error } = await this.supabase
//       .schema('evm_coordination')
//       .from('vehicle_requests')
//       .select('*')
//       .ilike('dealer_name', dealer_name || '%');

//     if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
//     return data || [];
//   }
// }

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase/supabase.service'; // import service bạn vừa viết
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';

@Injectable()
export class DealerCoordinationService implements OnModuleInit {
  private client!: ClientProxy;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService, // inject service
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
  // CREATE REQUEST (NEW)
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

      const { data: request, error } = await this.supabaseService
        .getClient()
        .schema('evm_coordination')
        .from('vehicle_requests')
        .insert({
          dealer_name,
          email,
          address,
          quantity,
          user_id,
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
  async getVehicleRequestsByDealerName(dealer_name?: string): Promise<any[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*')
      .ilike('dealer_name', dealer_name ? `%${dealer_name}%` : '%');

    if (error) throw new Error(`Failed to get vehicle requests: ${error.message}`);
    return data || [];
  }
  // dealer-coordination.service.ts

  // Thêm 2 methods này nếu chưa có
  async getAllVehicleRequests(): Promise<any[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .schema('evm_coordination')
      .from('vehicle_requests')
      .select('*');

    if (error) throw new Error(`Failed to get all vehicle requests: ${error.message}`);
    return data || [];
  }
}
