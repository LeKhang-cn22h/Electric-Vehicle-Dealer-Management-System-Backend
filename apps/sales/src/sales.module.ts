import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { TestSupabaseModule } from './supabase/test-supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/sales/.env',
    }),
    SupabaseModule,
    TestSupabaseModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
