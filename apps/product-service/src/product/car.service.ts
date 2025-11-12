import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from './supabase.client';

/**
 * Service xử lý logic và giao tiếp với Supabase/Postgres
 */
@Injectable()
export class ProductService {
  constructor(private readonly supabase: SupabaseClientService) {}

  async findAll() {
    const { data, error } = await this.supabase.client.from('cars').select('*');

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  async findOne(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data, error } = await this.supabase.client
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  async create(dto: any) {
    const { data, error } = await this.supabase.client
      .from('cars')
      .insert(dto)
      .select();

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  async update(id: number, dto: any) {
    const { data, error } = await this.supabase.client
      .from('cars')
      .update(dto)
      .eq('id', id)
      .select();

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }

  async delete(id: number) {
    const { error } = await this.supabase.client
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}
