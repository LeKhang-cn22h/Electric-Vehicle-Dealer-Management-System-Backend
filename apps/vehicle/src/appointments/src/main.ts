import { NestFactory } from '@nestjs/core';
import { Vehicle/appointmentsModule } from './vehicle/appointments.module';

async function bootstrap() {
  const app = await NestFactory.create(Vehicle/appointmentsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
