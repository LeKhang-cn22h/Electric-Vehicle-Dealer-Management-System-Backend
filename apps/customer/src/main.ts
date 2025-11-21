import { NestFactory } from '@nestjs/core';
import { CustomersModule } from './customer.module';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(CustomersModule);
  app.enableCors();
  await app.listen(process.env.PORT || 4404);
}
bootstrap();
