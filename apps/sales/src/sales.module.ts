import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { TestSupabaseModule } from './supabase/test-supabase.module';
import { QuotationModule } from './quotation/quotation.module';
import { OrderModule } from './order/order.module';
import { PricingPromotionModule } from './pricing-promotion/pricing-promotion.module';
import { ContractModule } from './contract/contract.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { OrderService } from './order/order.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/sales/.env',
    }),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'order_payment',
            type: 'direct',
          },
          {
            name: 'vehicle_exchange',
            type: 'direct',
          },
          {
            name: 'get_user',
            type: 'direct',
          },
          {
            name: 'vehicle_listPrice',
            type: 'direct',
          },
          {
            name: 'contract_user',
            type: 'direct',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URI'), // đọc từ env
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
    SupabaseModule,
    TestSupabaseModule,
    QuotationModule,
    OrderModule,
    PricingPromotionModule,
    ContractModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, OrderService],
})
export class SalesModule {}
