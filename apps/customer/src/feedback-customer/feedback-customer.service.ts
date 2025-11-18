import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
@Injectable()
export class FeedbackCustomerService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }
}
