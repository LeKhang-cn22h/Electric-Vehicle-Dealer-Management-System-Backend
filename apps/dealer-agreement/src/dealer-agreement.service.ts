// src/dealer-agreement/dealer-agreement.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CreateContractRequestDto {
  dealer_name: string;
  address: string;
  phone: string;
  email: string;
}

@Injectable()
export class DealerAgreementService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }, // không dùng session (service)
    });
  }

  async createContractRequest(dto: CreateContractRequestDto): Promise<void> {
    const { error } = await this.supabase
      .schema('evm_agreement') // gọi schema
      .from('contract_requests') // gọi bảng kèm schema
      .insert([
        {
          dealer_name: dto.dealer_name,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
        },
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      throw new InternalServerErrorException('Không thể lưu yêu cầu hợp đồng');
    }
  }
}
