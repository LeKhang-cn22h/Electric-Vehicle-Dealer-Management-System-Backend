import { NestFactory } from '@nestjs/core';
import { BillingModule } from './billing.module';
import { ConfigModule } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(BillingModule);
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  });
  const port = Number(process.env.PORT) || 4300;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
