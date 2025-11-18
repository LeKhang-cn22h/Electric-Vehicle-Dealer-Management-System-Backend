import { Module } from '@nestjs/common';
import { ProfileCustomerService } from './profile-customer.service';
import { ProfileCustomerController } from './profile-customer.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [ProfileCustomerService],
  controllers: [ProfileCustomerController],
})
export class ProfileCustomerModule {}
