import { NestFactory } from '@nestjs/core';
import { BillingModule } from './billing.module';

async function bootstrap() {
  const app = await NestFactory.create(BillingModule);
  const port = Number(process.env.PORT) || 4300;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
