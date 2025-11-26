import { Module } from '@nestjs/common';
import { ContractsController } from './contract.controller';
import { ContractsService } from './contract.service';
import { OrderModule } from '../order/order.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PricingPromotionModule } from '../pricing-promotion/pricing-promotion.module';

@Module({
  imports: [
    OrderModule,
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
            name: 'contract_vehicle',
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
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractModule {}
