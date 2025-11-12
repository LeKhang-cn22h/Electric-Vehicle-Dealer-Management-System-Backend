import { NestFactory } from '@nestjs/core';
import { EvDealerApiGatewayModule } from './ev-dealer-api-gateway.module';
import { ClientProxy, Transport, ClientProxyFactory } from '@nestjs/microservices';
import {
  GATEWAY_PORT,
  USER_SERVICE_PORT,
  PRODUCT_SERVICE_PORT,
  MICROservice_HOST,
} from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(EvDealerApiGatewayModule);

  // Enable CORS
  app.enableCors();

  // // Connect TCP microservices
  // app.connectMicroservice({
  //   name: 'USER_SERVICE',
  //   transport: Transport.TCP,
  //   options: { host: '127.0.0.1', port: USER_SERVICE_PORT },
  // });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const productClient: ClientProxy = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: {
      host: 'product-service', // tên service trong docker-compose
      port: 4001, // port product-service lắng nghe
    },
  });
  app.connectMicroservice({
    name: 'PRODUCT_SERVICE',
    transport: Transport.TCP,
    options: { host: 'product-service', port: PRODUCT_SERVICE_PORT },
  });
  await productClient.connect();
  // Start microservices
  await app.startAllMicroservices();
  console.log('TCP microservices started!');
  await app.listen(process.env.GATEWAY_PORT || 4000);
  console.log('API Gateway running on http://localhost:' + (process.env.GATEWAY_PORT || 4000));

  // Start HTTP server
  // await app.listen(GATEWAY_PORT);
  // console.log(`API Gateway is running on http://localhost:${GATEWAY_PORT}`);
}

bootstrap();
