import { Module } from '@nestjs/common';
import { CustomersController } from './customer.controller';
import { CustomersService } from './customer.service';
import { ConfigModule } from '@nestjs/config';
import { ProfileCustomerModule } from './profile-customer/profile-customer.module';
import { FeedbackCustomerModule } from './feedback-customer/feedback-customer.module';
import { SupabaseService } from './supabase/supabase.service';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/customer/.env',
    }),
    ProfileCustomerModule,
    FeedbackCustomerModule,
    SupabaseModule,
  ],
  exports: [CustomersService],
  controllers: [CustomersController],
  providers: [CustomersService, SupabaseService],
})
export class CustomersModule {}
