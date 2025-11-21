import { NestFactory } from '@nestjs/core';
import { Vehicle/vehicleNewModule } from './vehicle/vehicle-new.module';

async function bootstrap() {
  const app = await NestFactory.create(Vehicle/vehicleNewModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
