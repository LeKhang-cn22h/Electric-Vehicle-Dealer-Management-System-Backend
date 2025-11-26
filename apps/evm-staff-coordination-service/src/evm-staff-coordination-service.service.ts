// src/evm-staff-coordination-service.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service'; // Import từ supabase service có sẵn
import { CreateVehicleRequestDto } from './dto/create-vehicle-request.dto';
import { ProcessVehicleRequestDto } from './dto/process-vehicle-request.dto';

@Injectable()
export class EvmStaffCoordinationService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Lấy Supabase client
  private getClient() {
    return this.supabaseService.getClient();
  }

  // Tạo yêu cầu mới (dealer gửi)
  async createVehicleRequest(createDto: CreateVehicleRequestDto, userId: string) {
    const { data, error } = await this.getClient()
      .from('vehicle_requests')
      .insert([
        {
          dealer_name: createDto.dealer_name,
          email: createDto.email,
          address: createDto.address,
          quantity: createDto.quantity,
          status: 'pending',
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to create request: ${error.message}`);
    }

    return data[0];
  }

  // Lấy danh sách yêu cầu cho hãng xem
  async getVehicleRequests(filters?: {
    status?: string;
    dealer_name?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, dealer_name, page = 1, limit = 10 } = filters || {};

    let query = this.getClient().from('vehicle_requests').select('*', { count: 'exact' });

    // Áp dụng filters
    if (status) {
      query = query.eq('status', status);
    }
    if (dealer_name) {
      query = query.ilike('dealer_name', `%${dealer_name}%`);
    }

    // Phân trang
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to fetch requests: ${error.message}`);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Hãng xử lý yêu cầu
  async processVehicleRequest(processDto: ProcessVehicleRequestDto) {
    const { id, status, notes, assigned_staff_id, estimated_delivery_date } = processDto;

    // Kiểm tra yêu cầu tồn tại
    const { data: existingRequest, error: fetchError } = await this.getClient()
      .from('vehicle_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRequest) {
      throw new NotFoundException('Vehicle request not found');
    }

    // Validate status
    const validStatuses = ['approved', 'rejected', 'processing', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    // Cập nhật trạng thái và thông tin xử lý
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) updateData.notes = notes;
    if (assigned_staff_id) updateData.assigned_staff_id = assigned_staff_id;
    if (estimated_delivery_date) updateData.estimated_delivery_date = estimated_delivery_date;

    const { data, error } = await this.getClient()
      .from('vehicle_requests')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to process request: ${error.message}`);
    }

    // Gửi notification khi trạng thái thay đổi
    await this.sendStatusNotification(data[0]);

    return data[0];
  }

  // Lấy chi tiết yêu cầu
  async getVehicleRequestById(id: number) {
    const { data, error } = await this.getClient()
      .from('vehicle_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException('Vehicle request not found');
    }

    return data;
  }

  // Thống kê cho dashboard hãng
  async getRequestStats() {
    const { data, error } = await this.getClient()
      .from('vehicle_requests')
      .select('status, quantity');

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to get stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      total_vehicles: data.reduce((sum, item) => sum + item.quantity, 0),
      pending: data.filter((item) => item.status === 'pending').length,
      approved: data.filter((item) => item.status === 'approved').length,
      rejected: data.filter((item) => item.status === 'rejected').length,
      processing: data.filter((item) => item.status === 'processing').length,
    };

    return stats;
  }

  // Cập nhật yêu cầu
  async updateVehicleRequest(id: number, updateData: Partial<CreateVehicleRequestDto>) {
    const { data, error } = await this.getClient()
      .from('vehicle_requests')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to update request: ${error.message}`);
    }

    return data[0];
  }

  // Xóa yêu cầu
  async deleteVehicleRequest(id: number) {
    const { error } = await this.getClient().from('vehicle_requests').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to delete request: ${error.message}`);
    }

    return { message: 'Request deleted successfully' };
  }

  // Tìm kiếm yêu cầu theo email dealer
  async searchVehicleRequestsByEmail(email: string) {
    const { data, error } = await this.getClient()
      .from('vehicle_requests')
      .select('*')
      .ilike('email', `%${email}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to search requests: ${error.message}`);
    }

    return data;
  }

  // Lấy yêu cầu theo user_id
  async getVehicleRequestsByUserId(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, page = 1, limit = 10 } = filters || {};

    let query = this.getClient()
      .from('vehicle_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Supabase error:', error);
      throw new BadRequestException(`Failed to fetch user requests: ${error.message}`);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // Gửi notification khi trạng thái thay đổi
  private async sendStatusNotification(request: any) {
    // Implement notification logic (email, push notification, etc.)
    console.log(`Status updated for request ${request.id}: ${request.status}`);
    console.log(`Dealer: ${request.dealer_name}, Email: ${request.email}`);

    // TODO: Integrate with your email service or notification service
    // await this.emailService.sendStatusUpdate(request);
  }

  // Health check để kiểm tra kết nối Supabase
  async healthCheck() {
    try {
      const { error } = await this.getClient().from('vehicle_requests').select('count').limit(1);

      if (error) {
        return {
          status: 'error',
          message: `Supabase connection error: ${error.message}`,
        };
      }

      return {
        status: 'ok',
        message: 'Service and database are connected successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Health check failed: ${error.message}`,
      };
    }
  }
}
