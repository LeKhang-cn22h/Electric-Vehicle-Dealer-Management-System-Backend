// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';
// import { EvmStaffCoordinationController } from './evm-staff-coordination-service.controller';
// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true, // giúp ConfigService dùng được mọi nơi mà không cần import lại
//       envFilePath: '.env', // nếu file nằm ở thư mục gốc service, hoặc khai báo đúng đường dẫn
//     }),
//   ],
//   controllers: [EvmStaffCoordinationController],
//   providers: [EvmStaffCoordinationService],
//   exports: [EvmStaffCoordinationService],
// })
// export class EvmStaffCoordinationModule {}
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';
import { EvmStaffCoordinationController } from './evm-staff-coordination-service.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: 'evm_staff_coordination_queue',
            queueOptions: { durable: false },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/evm-staff-coordination-service/.env',
    }),
  ],
  controllers: [EvmStaffCoordinationController],
  providers: [EvmStaffCoordinationService],
  exports: [EvmStaffCoordinationService],
})
export class EvmStaffCoordinationModule {}
