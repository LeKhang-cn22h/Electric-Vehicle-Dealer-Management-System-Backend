import { NestFactory } from '@nestjs/core';
import { DealerAgreementServiceModule } from './dealer-agreement.module';

async function bootstrap() {
  const app = await NestFactory.create(DealerAgreementServiceModule, {
    logger: ['error', 'warn', 'log'], // bật log cơ bản
  });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);

  console.log(`🚀 Dealer Agreement Service is running on port ${port}`);
}
bootstrap();
