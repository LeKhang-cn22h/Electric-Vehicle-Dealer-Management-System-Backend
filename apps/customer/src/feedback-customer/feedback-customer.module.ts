import { Module } from '@nestjs/common';
import { FeedbackCustomerService } from './feedback-customer.service';
import { FeedbackCustomerController } from './feedback-customer.controller';
import { SupabaseModule } from '../supabase/supabase.module';
@Module({
  imports: [SupabaseModule],
  providers: [FeedbackCustomerService],
  controllers: [FeedbackCustomerController],
})
export class FeedbackCustomerModule {}
