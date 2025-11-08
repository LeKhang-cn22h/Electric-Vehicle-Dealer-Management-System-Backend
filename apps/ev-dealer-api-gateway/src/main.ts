import { NestFactory } from '@nestjs/core';
import { EvDealerApiGatewayModule } from './ev-dealer-api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(EvDealerApiGatewayModule);
  await app.listen(process.env.port ?? 4001);
}
bootstrap();
