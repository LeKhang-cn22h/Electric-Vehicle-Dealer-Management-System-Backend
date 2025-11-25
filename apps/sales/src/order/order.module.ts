import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { QuotationModule } from '../quotation/quotation.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PricingPromotionModule } from '../pricing-promotion/pricing-promotion.module';

@Module({
  imports: [
    QuotationModule,
    PricingPromotionModule,
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'customer_quotaion',
            type: 'direct',
          },
          {
            name: 'order_vehicle',
            type: 'direct',
          },
          {
            name: 'order_payment',
            type: 'direct',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URI'), // đọc từ env
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
