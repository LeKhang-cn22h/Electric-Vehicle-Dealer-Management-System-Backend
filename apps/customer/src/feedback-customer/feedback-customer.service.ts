import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackCustomerService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }
  async createFeedback(req, createFeedbackDto: CreateFeedbackDto) {
    //  Lấy user từ JWT trong header
    const user = await this.supabaseService.getUserFromRequest(req);
    if (!user) throw new Error('Unauthorized: Token missing or invalid');

    //  Gắn uid từ Supabase
    const feedbackData = {
      ...createFeedbackDto,
      customer_uid: user.id,
    };

    // Lưu feedback
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create feedback: ${error.message}`);

    return data;
  }

  async findAllFeedbacks() {
    const query = this.supabase
      .schema('customer')
      .from('feedback')
      .select(
        `
        *
      `,
      )
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch feedbacks: ${error.message}`);
    }

    return data;
  }
  // Lấy feedbacks của customer đang đăng nhập
  async findAllFeedbacksCustomer(req) {
    const user = await this.supabaseService.getUserFromRequest(req);
    if (!user) throw new Error('Unauthorized: Token missing or invalid');

    const query = this.supabase
      .schema('customer')
      .from('feedback')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .eq('customer_uid', user.id)
      .neq('status', 'Hidden');
    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch feedbacks: ${error.message}`);
    }
    console.log(' Data from Supabase:', JSON.stringify(data, null, 2));
    return data;
  }

  async findFeedbackById(id: number) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .select(
        `
        *`,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Feedback with ID ${id} not found`);
      }
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }

    return data;
  }

  async updateFeedback(req, id: number, updateFeedbackDto: UpdateFeedbackDto) {
    // Check if feedback exists
    await this.findFeedbackById(id);
    // 1️⃣ Lấy admin từ JWT trong header
    const admin = await this.supabaseService.getUserFromRequest(req);
    if (!admin) throw new Error('Unauthorized: Token missing or invalid');
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .update({
        ...updateFeedbackDto,
        updated_at: new Date().toISOString(),
        admin_uid: admin.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update feedback: ${error.message}`);
    }

    return data;
  }
  async deleteFeedback(id: number) {
    // Check if feedback exists
    await this.findFeedbackById(id);
    const { error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .update({
        status: 'Hidden',
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }

    return { message: 'Feedback deleted successfully' };
  }
}
