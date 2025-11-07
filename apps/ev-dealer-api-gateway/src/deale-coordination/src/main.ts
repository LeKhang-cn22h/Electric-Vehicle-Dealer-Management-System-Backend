import { NestFactory } from '@nestjs/core';
import { DealerCoordinationModule } from './deale-coordination.module';

async function bootstrap() {
  const app = await NestFactory.create(DealerCoordinationModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
