import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

import { Request } from 'express';

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
      auth: { persistSession: false },
    });
  }

  // Hàm lấy user từ request dựa trên token Authorization Bearer
  async getUserFromRequest(req: Request): Promise<User | null> {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || typeof authHeader !== 'string' || authHeader.trim() === '') {
        return null;
      }
      let token = authHeader.trim();
      if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice(7).trim();
      }
      if (!token) throw new Error('Invalid token');

      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data?.user) throw new Error('Invalid token');

      return data.user;
    } catch {
      throw new InternalServerErrorException('Invalid or missing token');
    }
  }

  // Tạo request với thông tin user lấy được từ token
  async createContractRequest(req: Request, dto: CreateContractRequestDto): Promise<void> {
    // Lấy user
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new InternalServerErrorException('Unauthorized: user not found');
    }

    const { error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .insert([
        {
          dealer_name: dto.dealer_name,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          user_uid: user.id,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      throw new InternalServerErrorException('Không thể lưu yêu cầu hợp đồng');
    }
  }
}
