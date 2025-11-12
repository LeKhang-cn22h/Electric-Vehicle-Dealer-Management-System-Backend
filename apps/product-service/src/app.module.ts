import { Module } from '@nestjs/common';
import { ProductService } from './product/car.service';
import { ProductController } from './product/car.controller';
import { SupabaseClientService } from './product/supabase.client';
import { ProductMessageHandlers } from './product/car.message';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [ProductController],
  providers: [SupabaseClientService, ProductService, ProductMessageHandlers],
  exports: [ProductService],
})
export class AppModule {}
