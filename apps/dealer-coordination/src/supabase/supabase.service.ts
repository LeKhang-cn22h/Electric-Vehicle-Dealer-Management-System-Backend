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

  // Method cũ - giữ lại nếu cần dùng ở chỗ khác
  async getUserFromRequest(req: any) {
    const authHeader = req.headers?.['authorization'] || '';
    return this.getUserFromToken(authHeader);
  }

  // Method mới - nhận trực tiếp auth string
  async getUserFromToken(auth: string) {
    try {
      if (!auth || auth.trim() === '') {
        return null;
      }

      let token = auth.trim();

      // Nếu có tiền tố Bearer thì loại bỏ
      if (token.toLowerCase().startsWith('bearer ')) {
        token = token.slice(7).trim();
      }

      if (!token) {
        throw new Error('Invalid token');
      }

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
