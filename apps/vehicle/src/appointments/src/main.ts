import { NestFactory } from '@nestjs/core';
import { AppointmentsModule } from './appointments.module';

async function bootstrap() {
  const app = await NestFactory.create(AppointmentsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
