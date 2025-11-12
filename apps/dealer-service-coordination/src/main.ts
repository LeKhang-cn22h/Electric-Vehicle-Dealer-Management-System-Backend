import { NestFactory } from '@nestjs/core';
import { EvmStaffCoordinationModule } from './dealer-coordination.module';

async function bootstrap() {
  const app = await NestFactory.create(EvmStaffCoordinationModule);
  app.enableCors();
  await app.listen(3001);
  console.log('Dealer Service Coordination running on port 3001');
}

bootstrap();
