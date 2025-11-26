// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

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
// }
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Request } from 'express';

export interface CreateContractRequestDto {
  dealer_name: string;
  address: string;
  phone: string;
  email: string;
}

export interface ContractRequestResponse {
  id: number;
  dealer_name: string;
  address: string;
  phone: string;
  email: string;
  user_id: string;
  status: string;
  created_at: string;
  dealer_info?: {
    email: string;
    password: string;
    message: string;
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
  async createContractRequest(req: Request, dto: CreateContractRequestDto): Promise<void> {
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
          user_id: user.id,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      throw new InternalServerErrorException('Không thể lưu yêu cầu hợp đồng');
    }
  }

  // ✅ THÊM: Lấy contract request theo user_id
  async getContractRequestByUser(req: Request): Promise<ContractRequestResponse> {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new InternalServerErrorException('Unauthorized: user not found');
    }

    // Lấy contract request của user
    const { data: contractRequest, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Không tìm thấy yêu cầu hợp đồng');
      }
      throw new InternalServerErrorException('Lỗi khi lấy thông tin hợp đồng');
    }

    if (!contractRequest) {
      throw new NotFoundException('Không tìm thấy yêu cầu hợp đồng');
    }

    const response: ContractRequestResponse = {
      id: contractRequest.id,
      dealer_name: contractRequest.dealer_name,
      address: contractRequest.address,
      phone: contractRequest.phone,
      email: contractRequest.email,
      user_id: contractRequest.user_id,
      status: contractRequest.status,
      created_at: contractRequest.created_at,
    };

    // ✅ Nếu contract được approved, thêm thông tin dealer
    if (contractRequest.status === 'approved') {
      response.dealer_info = {
        email: contractRequest.email, // Email từ contract request
        password: '12345678', // Mật khẩu mặc định
        message: 'Chúc mừng bạn đã trở thành dealer chính thức của EVM!',
      };
    }

    return response;
  }

  // ✅ THÊM: Lấy tất cả contract requests của user
  async getAllContractRequestsByUser(req: Request): Promise<ContractRequestResponse[]> {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new InternalServerErrorException('Unauthorized: user not found');
    }

    const { data: contractRequests, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Lỗi khi lấy danh sách hợp đồng');
    }

    return contractRequests.map((contract) => {
      const response: ContractRequestResponse = {
        id: contract.id,
        dealer_name: contract.dealer_name,
        address: contract.address,
        phone: contract.phone,
        email: contract.email,
        user_id: contract.user_id,
        status: contract.status,
        created_at: contract.created_at,
      };

      // ✅ Thêm thông tin dealer nếu được approved
      if (contract.status === 'approved') {
        response.dealer_info = {
          email: contract.email,
          password: '12345678',
          message: 'Chúc mừng bạn đã trở thành dealer chính thức của EVM!',
        };
      }

      return response;
    });
  }

  // ✅ THÊM: Lấy contract request theo ID (chỉ của user đó)
  async getContractRequestById(req: Request, id: number): Promise<ContractRequestResponse> {
    const user = await this.getUserFromRequest(req);
    if (!user) {
      throw new InternalServerErrorException('Unauthorized: user not found');
    }

    const { data: contractRequest, error } = await this.supabase
      .schema('evm_agreement')
      .from('contract_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // ✅ CHỈ lấy request của user đang đăng nhập
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Không tìm thấy yêu cầu hợp đồng hoặc không có quyền truy cập');
      }
      throw new InternalServerErrorException('Lỗi khi lấy thông tin hợp đồng');
    }

    if (!contractRequest) {
      throw new NotFoundException('Không tìm thấy yêu cầu hợp đồng');
    }

    const response: ContractRequestResponse = {
      id: contractRequest.id,
      dealer_name: contractRequest.dealer_name,
      address: contractRequest.address,
      phone: contractRequest.phone,
      email: contractRequest.email,
      user_id: contractRequest.user_id,
      status: contractRequest.status,
      created_at: contractRequest.created_at,
    };

    // ✅ Thêm thông tin dealer nếu được approved
    if (contractRequest.status === 'approved') {
      response.dealer_info = {
        email: contractRequest.email,
        password: '12345678',
        message: 'Chúc mừng bạn đã trở thành dealer chính thức của EVM!',
      };
    }

    return response;
  }
}
