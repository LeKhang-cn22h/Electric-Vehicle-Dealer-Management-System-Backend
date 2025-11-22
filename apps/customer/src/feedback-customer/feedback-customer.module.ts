import { Module } from '@nestjs/common';
import { FeedbackCustomerService } from './feedback-customer.service';
import { FeedbackCustomerController } from './feedback-customer.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, SupabaseModule],
  providers: [FeedbackCustomerService],
  controllers: [FeedbackCustomerController],
})
export class FeedbackCustomerModule {}
