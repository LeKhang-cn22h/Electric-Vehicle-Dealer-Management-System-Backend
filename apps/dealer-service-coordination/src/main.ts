import { NestFactory } from '@nestjs/core';
import { DealerCoordinationModule } from './dealer-coordination.module';

async function bootstrap() {
  const app = await NestFactory.create(DealerCoordinationModule);
  app.enableCors();
  await app.listen(3001);
  console.log('Dealer Service Coordination running on port 3001');
}

bootstrap();
