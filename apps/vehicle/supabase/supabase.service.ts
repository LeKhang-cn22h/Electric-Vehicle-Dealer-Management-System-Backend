import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    // Chỉ tạo client với service key cho backend
    this.client = createClient(url, serviceKey);
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

  async getUserFromRequest(req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');

    const { data, error } = await this.client.auth.getUser(token);
    if (error) throw new Error('Invalid token');

    return data.user;
  }
}
