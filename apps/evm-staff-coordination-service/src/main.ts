import { NestFactory } from '@nestjs/core';
import { EvmStaffCoordinationModule } from './evm-staff-coordination-service.module';

// async function bootstrap() {
//   const app = await NestFactory.create(EvmStaffCoordinationModule);
//   await app.listen(process.env.port ?? 3002);
// }
// bootstrap();
async function bootstrap() {
  const port = process.env.PORT ?? 3002;
  const app = await NestFactory.create(EvmStaffCoordinationModule);
  await app.listen(port);
  console.log(`EvmStaffCoordinationService running on port ${port}`);
}
bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { EvmStaffCoordinationModule } from './evm-staff-coordination-service.module';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import { ConfigService } from '@nestjs/config';

// async function bootstrap() {
//   const app = await NestFactory.create(EvmStaffCoordinationModule);

//   const configService = app.get(ConfigService);

//   // Tạo microservice RabbitMQ
//   app.connectMicroservice<MicroserviceOptions>({
//     transport: Transport.RMQ,
//     options: {
//       urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
//       queue: 'your_queue_name',
//       queueOptions: {
//         durable: false,
//       },
//     },
//   });

//   // Khởi động microservice
//   await app.startAllMicroservices();

//   // Nếu bạn muốn app HTTP listen cổng thì chạy lệnh này
//   // Nếu không có API HTTP, bạn có thể không gọi app.listen()
//   await app.listen(process.env.PORT || 3002);
// }
// bootstrap();
