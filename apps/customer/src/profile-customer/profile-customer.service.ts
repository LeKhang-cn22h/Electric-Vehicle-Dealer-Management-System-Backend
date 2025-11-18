import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfileCustomerService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // ==========================
  // CRUD API USING SUPABASE
  // ==========================

  async findAll() {
    const { data, error } = await this.supabase.schema('customer').from('customers').select('*');

    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async create(payload: any) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .insert(payload)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: number, payload: any) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: number) {
    const { error } = await this.supabase
      .schema('customer')
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    return { message: 'Customer deleted successfully' };
  }
}
