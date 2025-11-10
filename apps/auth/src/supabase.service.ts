import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), 'apps/auth/.env');
dotenv.config({ path: envPath });

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;

    if (!url || !anon) {
      throw new Error('Supabase env not configured');
    }

    this.supabase = createClient(url, anon);
  }

  get client() {
    return this.supabase;
  }
}
