import { NestFactory } from '@nestjs/core';
import { EvmAgreementModule } from './evm-staff-agreement-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EvmAgreementModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3004);
}
bootstrap();
