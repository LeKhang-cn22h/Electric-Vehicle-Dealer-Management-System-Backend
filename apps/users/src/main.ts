import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UsersModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule,
    { transport: Transport.TCP, options: { host: '127.0.0.1', port: 3001 } },
  );
  await app.listen();
  console.log('Users MS listening on tcp://127.0.0.1:3001');
}
bootstrap();
