import { NestFactory } from '@nestjs/core';
import { EvmStaffCoordinationServiceModule } from './evm-staff-coordination-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EvmStaffCoordinationServiceModule);
  await app.listen(process.env.port ?? 3003);
}
bootstrap();
