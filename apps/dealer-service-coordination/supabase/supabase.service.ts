import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    }

    this.client = createClient(url, anonKey);
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async uploadImage(bucket: string, path: string, file: Buffer) {
    return await this.client.storage.from(bucket).upload(path, file, { upsert: true });
  }

  async getPublicUrl(bucket: string, path: string) {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  async getUserFromRequest(req) {
    try {
      const authHeader = req.headers['authorization'];

      // Không có header → không có token → return null
      if (!authHeader || authHeader.trim() === '') {
        return null;
      }

      let token = authHeader.trim();

      // Nếu có tiền tố Bearer thì loại bỏ
      if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice(7).trim();
      }

      // Nếu sau khi cắt mà token trống → token không hợp lệ
      if (!token) {
        throw new Error('Invalid token');
      }

      // Gọi Supabase để lấy user
      const { data, error } = await this.client.auth.getUser(token);

      if (error || !data?.user) {
        throw new Error('Invalid token');
      }

      return data.user;
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
}
