import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ConfigModule } from '@nestjs/config';
import { ArController } from './ar.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/ar/.env' }),
    RabbitMQModule.forRoot({
      exchanges: [{ name: 'order_payment', type: 'direct' }],
      uri: process.env.RABBITMQ_URI,
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [ArController],
  providers: [ArService],
})
export class AppModule {}
