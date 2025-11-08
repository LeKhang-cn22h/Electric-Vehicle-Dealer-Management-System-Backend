import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DealerCoordinationController } from './dealer-coordination.controller';
import { DealerCoordinationService } from './dealer-coordination.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'dealer-events',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [DealerCoordinationController],
  providers: [DealerCoordinationService],
})
export class DealerCoordinationModule {}
