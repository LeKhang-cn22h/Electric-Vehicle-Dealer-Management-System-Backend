// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { ClientsModule, Transport } from '@nestjs/microservices';
// import { DealerCoordinationController } from './dealer-coordination.controller';
// import { DealerCoordinationService } from './dealer-coordination.service';

// @Module({
//   imports: [
//     ConfigModule.forRoot({ isGlobal: true }),
//     ClientsModule.register([
//       {
//         name: 'RABBITMQ_SERVICE',
//         transport: Transport.RMQ,
//         options: {
//           urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
//           queue: 'dealer-events',
//           queueOptions: { durable: false },
//         },
//       },
//     ]),
//   ],
//   controllers: [DealerCoordinationController],
//   providers: [DealerCoordinationService],
// })
// export class DealerCoordinationModule {}
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DealerCoordinationController } from './dealer-coordination.controller';
import { DealerCoordinationService } from './dealer-coordination.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'dealer_coordination_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [DealerCoordinationController],
  providers: [DealerCoordinationService],
  exports: [DealerCoordinationService],
})
export class DealerCoordinationModule {}
