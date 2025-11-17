import { NestFactory } from '@nestjs/core';
import { EvDealerApiGatewayModule } from './ev-dealer-api-gateway.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(EvDealerApiGatewayModule);
  // ✅ Tăng giới hạn payload
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
