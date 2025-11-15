import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class EvmStaffAgreementServiceService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(EvmStaffAgreementServiceService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    console.log('SUPABASE_URL:', supabaseUrl);
    console.log('SUPABASE_KEY:', supabaseKey ? '****' : null);

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

    return data[0]; // trả về bản ghi vừa tạo
  }
  // Thêm đại lý mới
  async createDealer(payload: {
    dealer_name: string;
    address: string;
    phone: string;
    email: string;
  }) {
    const { data, error } = await this.supabase
      .schema('evm_agreement')
      .from('dealers')
      .insert(payload)
      .select();

    if (error) {
      this.logger.error('Error creating dealer:', error);
      throw error;
    }

    return data[0];
  }

  // Tạo hợp đồng mới
  async createContract(payload: {
    contract_request_id: number;
    dealer_id: number;
    sales_target: number;
    order_limit: number;
  }) {
    const { data, error } = await this.supabase
      .schema('evm_agreement')
      .from('contracts')
      .insert(payload)
      .select();

    if (error) {
      this.logger.error('Error creating contract:', error);
      throw error;
    }

    return data[0];
  }
  // async approveRequestAndCreateContract(id: number, contract_limit: number) {
  //   // 1. Lấy request
  //   const { data: request, error } = await this.supabase
  //     .schema('evm_agreement')
  //     .from('contract_requests')
  //     .select('*')
  //     .eq('id', id)
  //     .single();

  //   if (error || !request) throw new Error('Request not found');

  //   // 2. Update trạng thái request
  //   await this.supabase.from('contract_requests').update({ status: 'approved' }).eq('id', id);

  //   // 3. Tạo contract
  //   const { data: contract } = await this.supabase
  //     .schema('evm_agreement')
  //     .from('contracts')
  //     .insert({
  //       request_id: id,
  //       dealer_name: request.dealer_name,
  //       address: request.address,
  //       phone: request.phone,
  //       email: request.email,
  //       contract_limit,
  //       status: 'waiting_for_dealer',
  //     })
  //     .select()
  //     .single();

  //   return contract;
  // }
  async approveRequestAndCreateContract(id: number, sales_target: number, order_limit: number) {
    const { data: request, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) throw new Error('Request not found');

    await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .update({ status: 'approved' })
      .eq('id', id);

    const { data: contract, error: insertError } = await this.supabase
      .schema('evm_agreement')
      .from('contracts')
      .insert({
        contract_request_id: id,
        sales_target,
        order_limit,
        status: 'waiting_for_dealer',
        dealer_id: null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return contract;
  }

  async acceptContract(id: number, dealer_id: number) {
    const { error } = await this.supabase
      .schema('evm_agreement')
      .from('contracts')
      .update({ status: 'accepted', dealer_id })
      .eq('id', id);

    if (error) throw error;

    return { message: 'Contract accepted' };
  }

  async rejectContract(id: number) {
    const { error } = await this.supabase
      .schema('evm_agreement')
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) throw error;

    return { message: 'Contract rejected' };
  }
}
