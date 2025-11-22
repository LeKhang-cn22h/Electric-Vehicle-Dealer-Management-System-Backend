// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';

// @Injectable()
// export class EvmStaffAgreementServiceService {
//   private supabase: SupabaseClient;
//   private readonly logger = new Logger(EvmStaffAgreementServiceService.name);

//   constructor(private configService: ConfigService) {
//     const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
//     const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
//     console.log('SUPABASE_URL:', supabaseUrl);
//     console.log('SUPABASE_KEY:', supabaseKey ? '****' : null);

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

//     return data[0]; // trả về bản ghi vừa tạo
//   }
//   // Thêm đại lý mới
//   async createDealer(payload: {
//     dealer_name: string;
//     address: string;
//     phone: string;
//     email: string;
//   }) {
//     const { data, error } = await this.supabase
//       .schema('evm_agreement')
//       .from('dealers')
//       .insert(payload)
//       .select();

//     if (error) {
//       this.logger.error('Error creating dealer:', error);
//       throw error;
//     }

//     return data[0];
//   }

//   // Tạo hợp đồng mới
//   async createContract(payload: {
//     contract_request_id: number;
//     dealer_id: number;
//     sales_target: number;
//     order_limit: number;
//   }) {
//     const { data, error } = await this.supabase
//       .schema('evm_agreement')
//       .from('contracts')
//       .insert(payload)
//       .select();

//     if (error) {
//       this.logger.error('Error creating contract:', error);
//       throw error;
//     }

//     return data[0];
//   }

//   async approveRequestAndCreateContract(id: number, sales_target: number, order_limit: number) {
//     const { data: request, error } = await this.supabase
//       .schema('evm_agreement')
//       .from('contract_requests')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error || !request) throw new Error('Request not found');

//     await this.supabase
//       .schema('evm_agreement')
//       .from('contract_requests')
//       .update({ status: 'approved' })
//       .eq('id', id);

//     const { data: contract, error: insertError } = await this.supabase
//       .schema('evm_agreement')
//       .from('contracts')
//       .insert({
//         contract_request_id: id,
//         sales_target,
//         order_limit,
//         status: 'waiting_for_dealer',
//         dealer_id: null,
//       })
//       .select()
//       .single();

//     if (insertError) throw insertError;

//     return contract;
//   }
// }
// evm-staff-agreement-service.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { CreateDealerDto } from './DTO/createdealer.dto';
@Injectable()
export class EvmStaffAgreementServiceService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(EvmStaffAgreementServiceService.name);
  private readonly gatewayUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.gatewayUrl = this.configService.get<string>('GATEWAY_URL') || 'http://localhost:3000';

    console.log('SUPABASE_URL:', supabaseUrl);
    console.log('SUPABASE_KEY:', supabaseKey ? '****' : null);
    console.log('GATEWAY_URL:', this.gatewayUrl);

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

  async createContractRequest(payload: {
    dealer_name: string;
    address: string;
    phone: string;
    email: string;
  }) {
    const { data, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .insert(payload)
      .select();

    if (error) {
      this.logger.error('Error creating contract request:', error);
      throw error;
    }

    return data[0];
  }

  /**
   * Tạo dealer account qua Gateway
   */
  private async createDealerViaGateway(
    dealerInfo: {
      dealer_name: string;
      address: string;
      phone: string;
      email: string;
    },
    authToken: string,
  ) {
    try {
      this.logger.log(`Creating dealer account for: ${dealerInfo.email}`);

      // Tạo password tự động
      const generatedPassword = this.generateDefaultPassword();

      const payload = {
        dealer_name: dealerInfo.dealer_name,
        email: dealerInfo.email,
        phone: dealerInfo.phone,
        address: dealerInfo.address,
        password: generatedPassword,
      };

      this.logger.log('Payload sent to Gateway:', JSON.stringify(payload));

      const response = await firstValueFrom(
        this.httpService
          .post(`${this.gatewayUrl}/users/dealers`, payload, {
            headers: {
              authorization: authToken,
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error('Error from Users Service:', JSON.stringify(error.response?.data));
              throw new HttpException(
                error.response?.data || 'Failed to create dealer account',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      this.logger.log(`Dealer created successfully. ID: ${response.data.id}`);
      this.logger.log(`Generated password: ${generatedPassword}`);

      return {
        ...response.data,
        temporaryPassword: generatedPassword,
      };
    } catch (error) {
      this.logger.error('Failed to create dealer account:', error);
      throw error;
    }
  }

  /**
   * Tạo password ngẫu nhiên
   */
  private generateDefaultPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Approve request và tạo dealer (KHÔNG CẦN sales_target/order_limit)
   */
  // async approveRequestAndCreateDealer(id: number, adminAuthToken: string) {
  //   this.logger.log(`Processing approval for contract request ${id}`);

  //   // 1. Lấy thông tin contract request
  //   const { data: request, error } = await this.supabase
  //     .schema('evm_agreement')
  //     .from('contract_requests')
  //     .select('*')
  //     .eq('id', id)
  //     .single();

  //   if (error || !request) {
  //     this.logger.error(`Contract request ${id} not found`);
  //     throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
  //   }

  //   if (request.status === 'approved') {
  //     throw new HttpException('Request already approved', HttpStatus.BAD_REQUEST);
  //   }

  //   try {
  //     // 2. Tạo dealer account
  //     const dealerAccount = await this.createDealerViaGateway(
  //       {
  //         name: request.dealer_name,
  //         address: request.address,
  //         phone: request.phone,
  //         email: request.email,
  //       },
  //       adminAuthToken,
  //     );

  //     // 3. Update contract request status
  //     await this.supabase
  //       .schema('evm_agreement')
  //       .from('contract_requests')
  //       .update({
  //         status: 'approved',
  //         dealer_id: dealerAccount.id, // Lưu dealer_id vào contract_request
  //       })
  //       .eq('id', id);

  //     this.logger.log(`Contract request approved and dealer created: ${dealerAccount.id}`);

  //     return {
  //       success: true,
  //       message: 'Contract request approved and dealer account created successfully',
  //       contractRequest: {
  //         id: request.id,
  //         dealer_name: request.dealer_name,
  //         email: request.email,
  //         phone: request.phone,
  //         address: request.address,
  //         status: 'approved',
  //       },
  //       dealer: {
  //         id: dealerAccount.id,
  //         email: dealerAccount.email,
  //         name: dealerAccount.full_name || dealerAccount.dealer_name,
  //         phone: dealerAccount.phone,
  //         temporaryPassword: dealerAccount.temporaryPassword,
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error('Error in approval process:', error);

  //     // Rollback
  //     await this.supabase
  //       .schema('evm_agreement')
  //       .from('contract_requests')
  //       .update({ status: 'pending' })
  //       .eq('id', id);

  //     throw error;
  //   }
  // }
  async createDealerAndContract(id: number, adminAuthToken: string): Promise<CreateDealerDto> {
    // 1. Lấy thông tin contract request
    const { data: request, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) {
      this.logger.error(`Contract request ${id} not found`);
      throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
    }

    if (request.status === 'approved') {
      throw new HttpException('Request already approved', HttpStatus.BAD_REQUEST);
    }

    // 2. Map dữ liệu từ contract_request sang CreateDealerDto
    const createDealerDto: CreateDealerDto = {
      name: request.dealer_name,
      phone: request.phone ?? '',
      address: request.address ?? '',
      status: 'active', // hoặc lấy từ request.status nếu phù hợp
      user_email: request.email,
      user_password: this.generateTemporaryPassword(), // cần tạo hàm tạo password tạm thời hoặc lấy từ đâu đó
      user_full_name: request.dealer_name, // hoặc có thể để undefined nếu không có dữ liệu
      user_phone: request.phone ?? '',
    };

    return createDealerDto;
  }

  // Ví dụ hàm tạo mật khẩu tạm thời
  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-8) + 'A1!'; // password ngẫu nhiên, đủ mạnh
  }
}
