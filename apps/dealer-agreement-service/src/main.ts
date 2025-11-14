import { NestFactory } from '@nestjs/core';
import { DealerAgreementServiceModule } from './dealer-agreement-service.module';

async function bootstrap() {
  const app = await NestFactory.create(DealerAgreementServiceModule);
  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
