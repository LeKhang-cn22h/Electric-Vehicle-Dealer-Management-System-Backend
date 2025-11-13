import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class VehicleService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async findAll() {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async create(vehicle: any) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .insert(vehicle)
      .select();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: number, vehicle: any) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .update(vehicle)
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: number) {
    const { error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Vehicle deleted successfully' };
  }
}
