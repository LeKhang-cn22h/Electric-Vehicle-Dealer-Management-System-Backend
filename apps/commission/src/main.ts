import { NestFactory } from '@nestjs/core';
import { CommissionModule } from './commission.module';

async function bootstrap() {
  const app = await NestFactory.create(CommissionModule);
  await app.listen(process.env.PORT ?? 4500);
}
bootstrap();
