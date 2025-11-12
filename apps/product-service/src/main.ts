import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
/**
 * Đây là entrypoint của product-service.
 * Service này sẽ listen trên TCP port dành riêng,
 * và nhận các message từ API Gateway.
 */
async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: Number(process.env.TCP_PORT) || 4001 },
  });

  await app.listen();
  console.log(
    'Product service TCP microservice listening on port',
    Number(process.env.TCP_PORT) || 4001,
  );
}
bootstrap();
