import { Module } from '@nestjs/common';
import { ProfileCustomerService } from './profile-customer.service';
import { ProfileCustomerController } from './profile-customer.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    SupabaseModule,
    ConfigModule, // chắc chắn import ConfigModule
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'customer_quotaion',
            type: 'direct',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URI'), // đọc từ env
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ProfileCustomerService],
  controllers: [ProfileCustomerController],
})
export class ProfileCustomerModule {}
