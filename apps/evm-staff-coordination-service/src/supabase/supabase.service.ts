import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Định nghĩa type cho database nếu cần
type Database = any; // Hoặc bạn có thể define type cụ thể
config({ path: 'apps/evm-staff-coordination-service/.env' });
@Injectable()
export class SupabaseService {
  private client: SupabaseClient<Database, 'evm_coordination'>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:');
    console.log('- SUPABASE_URL:', url ? '✓' : '✗ MISSING');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✓' : '✗ MISSING');

    if (!url || !serviceKey) {
      throw new Error(
        'Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    this.client = createClient<Database, 'evm_coordination'>(url, serviceKey, {
      db: {
        schema: 'evm_coordination',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Supabase client initialized successfully');
  }

  getClient(): SupabaseClient<Database, 'evm_coordination'> {
    return this.client;
  }

  async uploadImage(bucket: string, path: string, file: Buffer) {
    return await this.client.storage.from(bucket).upload(path, file, { upsert: true });
  }

  async getPublicUrl(bucket: string, path: string) {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async getUserFromRequest(req: any) {
    const authHeader = req.headers?.['authorization'] || '';
    return this.getUserFromToken(authHeader);
  }

  async getUserFromToken(auth: string) {
    try {
      if (!auth || auth.trim() === '') {
        return null;
      }

      let token = auth.trim();

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
