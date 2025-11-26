// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
// import { create } from 'axios';
// import { Request } from 'express';

// export interface CreateContractRequestDto {
//   dealer_name: string;
//   address: string;
//   phone: string;
//   email: string;
// }

// @Injectable()
// export class DealerAgreementService {
//   private supabase: SupabaseClient;

//   constructor() {
//     const supabaseUrl = process.env.SUPABASE_URL;
//     const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//     if (!supabaseUrl || !supabaseServiceRoleKey) {
//       throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
//     }

//     this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
//       auth: { persistSession: false },
//     });
//   }

//   // Hàm lấy user từ request dựa trên token Authorization Bearer
//   async getUserFromRequest(req: Request): Promise<User | null> {
//     try {
//       const authHeader = req.headers['authorization'];
//       if (!authHeader || typeof authHeader !== 'string' || authHeader.trim() === '') {
//         return null;
//       }
//       let token = authHeader.trim();
//       if (token.toLowerCase().startsWith('bearer ')) {
//         token = token.slice(7).trim();
//       }
//       if (!token) throw new Error('Invalid token');

//       const { data, error } = await this.supabase.auth.getUser(token);
//       if (error || !data?.user) throw new Error('Invalid token');

//       return data.user;
//     } catch {
//       throw new InternalServerErrorException('Invalid or missing token');
//     }
//   }

//   // Tạo request với thông tin user lấy được từ token
//   async createContractRequest(req: Request, dto: CreateContractRequestDto): Promise<void> {
//     // Lấy user
//     const user = await this.getUserFromRequest(req);
//     if (!user) {
//       throw new InternalServerErrorException('Unauthorized: user not found');
//     }

//     const { error } = await this.supabase
//       .schema('evm_agreement')
//       .from('contract_requests')
//       .insert([
//         {
//           dealer_name: dto.dealer_name,
//           address: dto.address,
//           phone: dto.phone,
//           email: dto.email,
//           user_uid: user.id,
//           created_at: new Date().toISOString(),
//           status: 'pending',
//         },
//       ]);

//     if (error) {
//       console.error('Supabase insert error:', error);
//       throw new InternalServerErrorException('Không thể lưu yêu cầu hợp đồng');
//     }
//   }
//   // Lấy lịch sử request của user

// }
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Request } from 'express';

export interface CreateContractRequestDto {
  dealer_name: string;
  address: string;
  phone: string;
  email: string;
}

export interface ContractRequestHistory {
  id: string;
  dealer_name: string;
  address: string;
  phone: string;
  email: string;
  user_uid: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  // Thêm thông tin credentials khi approved
  credentials?: {
    email: string;
    password: string;
  };
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
  async createContractRequest(
    req: Request,
    dto: CreateContractRequestDto,
  ): Promise<ContractRequestHistory[]> {
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

    // Trả về lịch sử ngay sau khi tạo request thành công
    return this.getHistory(req);
  }

  // Lấy lịch sử request của user
  async getHistory(req: Request): Promise<ContractRequestHistory[]> {
    const user = await this.getUserFromRequest(req);
    if (!user) throw new InternalServerErrorException('Unauthorized');

    const { data, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*')
      .eq('user_uid', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw new InternalServerErrorException('Không thể lấy lịch sử');
    }

    // Thêm credentials cho các request đã được approve
    const historyWithCredentials: ContractRequestHistory[] = data.map((request) => {
      if (request.status === 'approved') {
        return {
          ...request,
          credentials: {
            email: request.email,
            password: '12345678',
          },
        };
      }
      return request;
    });

    return historyWithCredentials;
  }
}
