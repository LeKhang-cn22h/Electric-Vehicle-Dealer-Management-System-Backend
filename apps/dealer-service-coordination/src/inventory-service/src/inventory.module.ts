import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { SupabaseModule } from '../../../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    HttpModule, // ← Thêm để call users service
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
