import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PricingPromotionService } from './pricing-promotion.service';
import { PricingPromotionController } from './pricing-promotion.controller';

@Module({
  imports: [
    ConfigModule, // chắc chắn import ConfigModule
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'vehicle_exchange',
            type: 'direct',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URI'), // đọc từ env
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PricingPromotionController],
  providers: [PricingPromotionService],
  exports: [PricingPromotionService],
})
export class PricingPromotionModule {}
