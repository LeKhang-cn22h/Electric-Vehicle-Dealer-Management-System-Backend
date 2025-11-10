import { NestFactory } from '@nestjs/core';
import { EvDealerApiGatewayModule } from './ev-dealer-api-gateway.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(EvDealerApiGatewayModule);

  const tcpPort = Number(process.env.GATEWAY_TCP_PORT) || 4000;
  const httpPort = Number(process.env.PORT) || 3000;

  app.connectMicroservice({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: tcpPort },
  });

  await app.startAllMicroservices();
  console.log(`Gateway TCP đang chạy trên port ${tcpPort}`);

  await app.listen(httpPort);
  console.log(`Gateway HTTP đang chạy trên port ${httpPort}`);
}
bootstrap();
