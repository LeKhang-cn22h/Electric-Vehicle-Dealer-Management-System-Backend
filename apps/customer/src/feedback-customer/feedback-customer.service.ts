import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';

@Injectable()
export class FeedbackCustomerService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async createFeedback(createFeedbackDto: CreateFeedbackDto) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .insert([createFeedbackDto])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create feedback: ${error.message}`);
    }

    return data;
  }

  async findAllFeedbacks(status?: string, customer_id?: number) {
    let query = this.supabase
      .schema('customer')
      .from('feedback')
      .select(
        `
        *,
        customer:customer_id (id, name, email, phone)
      `,
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch feedbacks: ${error.message}`);
    }

    return data;
  }

  async findFeedbackById(id: number) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .select(
        `
        *,
        customer:customer_id (id, name, email, phone)
      `,
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

  async updateFeedback(id: number, updateFeedbackDto: UpdateFeedbackDto) {
    // Check if feedback exists
    await this.findFeedbackById(id);

    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .update({
        ...updateFeedbackDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update feedback: ${error.message}`);
    }

    return data;
  }

  async replyToFeedback(id: number, replyFeedbackDto: ReplyFeedbackDto) {
    // Check if feedback exists
    await this.findFeedbackById(id);

    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .update({
        admin_id: replyFeedbackDto.admin_id,
        admin_reply: replyFeedbackDto.admin_reply,
        status: replyFeedbackDto.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reply to feedback: ${error.message}`);
    }

    return data;
  }

  async deleteFeedback(id: number) {
    // Check if feedback exists
    await this.findFeedbackById(id);

    const { error } = await this.supabase.schema('customer').from('feedback').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }

    return { message: 'Feedback deleted successfully' };
  }

  async getFeedbacksByCustomer(customer_id: number) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customer feedbacks: ${error.message}`);
    }

    return data;
  }

  async getFeedbackStats() {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('feedback')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch feedback stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: data.filter((item) => item.status === 'pending').length,
      reviewed: data.filter((item) => item.status === 'reviewed').length,
      resolved: data.filter((item) => item.status === 'resolved').length,
    };

    return stats;
  }
}
