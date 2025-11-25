// // evm-staff-agreement-service.service.ts
// import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { HttpService } from '@nestjs/axios';
// import { firstValueFrom, catchError } from 'rxjs';
// import { AxiosError } from 'axios';
// import { CreateDealerDto } from './DTO/createdealer.dto';
// @Injectable()
// export class EvmStaffAgreementServiceService {
//   private supabase: SupabaseClient;
//   private readonly logger = new Logger(EvmStaffAgreementServiceService.name);
//   private readonly gatewayUrl: string;

//   constructor(
//     private configService: ConfigService,
//     private readonly httpService: HttpService,
//   ) {
//     const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
//     const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
//     this.gatewayUrl = this.configService.get<string>('GATEWAY_URL') || 'http://localhost:3000';

//     console.log('SUPABASE_URL:', supabaseUrl);
//     console.log('SUPABASE_KEY:', supabaseKey ? '****' : null);
//     console.log('GATEWAY_URL:', this.gatewayUrl);

//     if (!supabaseUrl || !supabaseKey) {
//       throw new Error('Missing Supabase environment variables');
//     }

//     this.supabase = createClient(supabaseUrl, supabaseKey);
//   }

//   async getContractRequests() {
//     const { data, error } = await this.supabase
//       .schema('evm_agreement')
//       .from('contract_requests')
//       .select('*');

//     if (error) {
//       this.logger.error('Error fetching contract requests:', error);
//       throw error;
//     }

//     return data;
//   }

//   async createContractRequest(payload: {
//     dealer_name: string;
//     address: string;
//     phone: string;
//     email: string;
//   }) {
//     const { data, error } = await this.supabase
//       .schema('evm_agreement')
//       .from('contract_requests')
//       .insert(payload)
//       .select();

//     if (error) {
//       this.logger.error('Error creating contract request:', error);
//       throw error;
//     }

//     return data[0];
//   }

//   /**
//    * Tạo dealer account qua Gateway
//    */
//   private async createDealerViaGateway(
//     dealerInfo: {
//       dealer_name: string;
//       address: string;
//       phone: string;
//       email: string;
//     },
//     authToken: string,
//   ) {
//     try {
//       this.logger.log(`Creating dealer account for: ${dealerInfo.email}`);

//       // Tạo password tự động
//       const generatedPassword = this.generateDefaultPassword();

//       const payload = {
//         dealer_name: dealerInfo.dealer_name,
//         email: dealerInfo.email,
//         phone: dealerInfo.phone,
//         address: dealerInfo.address,
//         password: generatedPassword,
//       };

//       this.logger.log('Payload sent to Gateway:', JSON.stringify(payload));

//       const response = await firstValueFrom(
//         this.httpService
//           .post(`${this.gatewayUrl}/users/dealers`, payload, {
//             headers: {
//               authorization: authToken,
//               'Content-Type': 'application/json',
//             },
//           })
//           .pipe(
//             catchError((error: AxiosError) => {
//               this.logger.error('Error from Users Service:', JSON.stringify(error.response?.data));
//               throw new HttpException(
//                 error.response?.data || 'Failed to create dealer account',
//                 error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
//               );
//             }),
//           ),
//       );

//       this.logger.log(`Dealer created successfully. ID: ${response.data.id}`);
//       this.logger.log(`Generated password: ${generatedPassword}`);

//       return {
//         ...response.data,
//         temporaryPassword: generatedPassword,
//       };
//     } catch (error) {
//       this.logger.error('Failed to create dealer account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Tạo password ngẫu nhiên
//    */
//   private generateDefaultPassword(): string {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let password = '';
//     for (let i = 0; i < 12; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return password;
//   }

//   async createDealerAndContract(id: number, adminAuthToken: string): Promise<CreateDealerDto> {
//     // 1. Lấy thông tin contract request
//     const { data: request, error } = await this.supabase
//       .schema('evm_agreement')
//       .from('contract_requests')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error || !request) {
//       this.logger.error(`Contract request ${id} not found`);
//       throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
//     }

//     if (request.status === 'approved') {
//       throw new HttpException('Request already approved', HttpStatus.BAD_REQUEST);
//     }

//     // 2. Map dữ liệu từ contract_request sang CreateDealerDto
//     const createDealerDto: CreateDealerDto = {
//       name: request.dealer_name,
//       phone: request.phone ?? '',
//       address: request.address ?? '',
//       status: 'active', // hoặc lấy từ request.status nếu phù hợp
//       user_email: request.email,
//       user_password: this.generateTemporaryPassword(), // cần tạo hàm tạo password tạm thời hoặc lấy từ đâu đó
//       user_full_name: request.dealer_name, // hoặc có thể để undefined nếu không có dữ liệu
//       user_phone: request.phone ?? '',
//     };

//     return createDealerDto;
//   }

//   // Ví dụ hàm tạo mật khẩu tạm thời
//   private generateTemporaryPassword(): string {
//     return Math.random().toString(36).slice(-8) + 'A1!'; // password ngẫu nhiên, đủ mạnh
//   }
// }
// evm-staff-agreement-service.service.ts
// apps/evm-staff-agreement-service/src/evm-staff-agreement-service.service.ts
// apps/evm-staff-agreement-service/src/evm-staff-agreement-service.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HttpService } from '@nestjs/axios';
import { NotificationService } from './notification/notification.service';

@Injectable()
export class EvmStaffAgreementServiceService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(EvmStaffAgreementServiceService.name);
  private readonly gatewayUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly notificationService: NotificationService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.gatewayUrl = this.configService.get<string>('GATEWAY_URL') || 'http://localhost:4000';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getContractRequests() {
    const { data, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*');

    if (error) {
      this.logger.error('Error fetching contract requests:', error);
      throw error;
    }

    return data;
  }

  /**
   * ✅ TẠO CONTRACT REQUEST với FCM token
   */
  async createContractRequest(payload: {
    dealer_name: string;
    address: string;
    phone: string;
    email: string;
    user_id?: string;
    fcm_token?: string;
    device_info?: any;
  }) {
    this.logger.log('📝 Creating contract request');
    this.logger.log('User ID:', payload.user_id);
    this.logger.log('FCM Token:', payload.fcm_token?.substring(0, 30) + '...');

    const { data, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .insert({
        dealer_name: payload.dealer_name,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        user_id: payload.user_id,
        fcm_token: payload.fcm_token,
        device_info: payload.device_info,
        status: 'pending',
      })
      .select();

    if (error) {
      this.logger.error('❌ Insert error:', error);
      throw error;
    }

    this.logger.log('✅ Contract request created');
    return data[0];
  }

  private generateDefaultPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * ✅ APPROVE CONTRACT và gửi notification
   */
  async createDealerAndContract(requestId: number, auth: string) {
    try {
      this.logger.log('=== CREATE DEALER AND CONTRACT ===');
      this.logger.log(`Request ID: ${requestId}`);

      // 1. Lấy contract request
      this.logger.log('📊 Fetching contract request...');
      const { data: request, error: fetchError } = await this.supabase
        .schema('evm_agreement')
        .from('contract_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        this.logger.error('❌ Contract request not found:', fetchError);
        throw new Error('Contract request not found');
      }

      this.logger.log('✅ Contract request found:', {
        id: request.id,
        dealer_name: request.dealer_name,
        email: request.email,
        user_id: request.user_id,
        has_fcm_token: !!request.fcm_token,
      });

      // 2. Tạo dealer account
      this.logger.log('👤 Creating dealer account...');

      const generatedPassword = this.generateDefaultPassword();

      const dealerPayload = {
        email: request.email,
        dealer_name: request.dealer_name,
        phone: request.phone,
        address: request.address,
        password: generatedPassword,
      };

      const createDealerResponse = await this.httpService.axiosRef.post(
        `${this.gatewayUrl}/users/dealers`,
        dealerPayload,
        {
          headers: {
            authorization: auth,
            'Content-Type': 'application/json',
          },
        },
      );

      const dealerAccount = createDealerResponse.data;
      this.logger.log('✅ Dealer account created:', {
        dealer_id: dealerAccount.id,
        email: dealerAccount.email,
      });

      // 3. Update contract request status
      this.logger.log('📝 Updating contract request status...');
      const { error: updateError } = await this.supabase
        .schema('evm_agreement')
        .from('contract_requests')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        this.logger.error('❌ Failed to update status:', updateError);
        throw new Error('Failed to update contract request status');
      }

      this.logger.log('✅ Contract request status updated');

      // 4. Tạo contract
      this.logger.log('📄 Creating contract...');
      const { data: contract, error: contractError } = await this.supabase
        .schema('evm_agreement')
        .from('contracts')
        .insert({
          contract_request_id: requestId,
          dealer_id: dealerAccount.id,
          sales_target: 1000000,
          order_limit: 50,
          status: 'active',
        })
        .select()
        .single();

      if (contractError) {
        this.logger.error('❌ Failed to create contract:', contractError);
        throw new Error('Failed to create contract');
      }

      this.logger.log('✅ Contract created:', { contract_id: contract.id });

      // 5. ✅ GỬI FCM NOTIFICATION
      if (request.fcm_token) {
        this.logger.log('🔔 Sending FCM notification...');
        this.logger.log(`FCM Token: ${request.fcm_token.substring(0, 30)}...`);

        try {
          const notificationResult = await this.notificationService.sendDirectly(
            request.fcm_token,
            '🎉 Yêu cầu hợp đồng đã được phê duyệt!',
            `Yêu cầu hợp đồng cho ${request.dealer_name} đã được phê duyệt.`,
            {
              type: 'CONTRACT_APPROVED',
              contractId: String(contract.id),
              dealerId: String(dealerAccount.id),
              dealerEmail: request.email,
              dealerTempPassword: generatedPassword,
              timestamp: new Date().toISOString(),
            },
          );

          if (notificationResult.success) {
            this.logger.log('✅✅✅ FCM notification sent successfully!');
          } else {
            this.logger.warn('⚠️ FCM notification failed:', notificationResult);
          }
        } catch (notifError) {
          this.logger.error('❌ Notification error:', notifError);
        }
      } else {
        this.logger.warn('⚠️ No FCM token - user may not receive notification');
      }

      this.logger.log('=== COMPLETE ===');

      return {
        success: true,
        contract,
        dealer: dealerAccount,
        credentials: {
          email: dealerAccount.email,
          temporaryPassword: generatedPassword,
        },
      };
    } catch (error) {
      this.logger.error('❌ FATAL ERROR:', error);
      this.logger.error('Error message:', error.message);

      if (error.response) {
        this.logger.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
        });
      }

      throw error;
    }
  }
}
