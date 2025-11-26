import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 🔥 Quan trọng: giúp toàn app đọc được .env
      envFilePath: './apps/billing/.env', // Nếu .env nằm ở root, dùng dòng này
    }),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
