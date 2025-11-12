import { NestFactory } from '@nestjs/core';
import { EvDealerApiGatewayModule } from './ev-dealer-api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(EvDealerApiGatewayModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
