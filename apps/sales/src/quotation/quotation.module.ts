import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { PricingPromotionModule } from '../pricing-promotion/pricing-promotion.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'customer_quotaion',
            type: 'direct',
          },
          {
            name: 'quotation_vehicle',
            type: 'direct',
          },
          {
            name: 'get_user',
            type: 'direct',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URI'), // đọc từ env
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
    PricingPromotionModule,
    ConfigModule, // chắc chắn import ConfigModule
  ],
  controllers: [QuotationController],
  providers: [QuotationService],
  exports: [QuotationService],
})
export class QuotationModule {}
