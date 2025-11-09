import { Module } from '@nestjs/common';
import { SupabaseService } from './test-supabase.service';
import { TestSupabaseController } from './test-supabase.controller';

@Module({
  controllers: [TestSupabaseController],
  providers: [SupabaseService],
})
export class TestSupabaseModule {}
