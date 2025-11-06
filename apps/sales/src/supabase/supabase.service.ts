import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL')!;
    const key =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.config.get<string>('SUPABASE_ANON_KEY')!;
    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  onModuleInit() {
    // optional health check or logging
    console.log('Supabase client initialized');
  }

  get client() {
    return this.supabase;
  }
}
