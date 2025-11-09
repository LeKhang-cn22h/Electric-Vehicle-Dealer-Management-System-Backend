import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async testConnection() {
    const { data, error } = await this.supabase.from('your_table_name').select('*').limit(1);

    if (error) {
      console.error('❌ Lỗi Supabase:', error);
      throw error;
    }

    console.log('✅ Kết nối thành công, dữ liệu mẫu:', data);
    return data;
  }
}
