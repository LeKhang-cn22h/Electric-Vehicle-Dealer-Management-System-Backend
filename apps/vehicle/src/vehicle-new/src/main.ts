import { NestFactory } from '@nestjs/core';
import { vehicleNewModule } from './vehicle-new.module';

async function bootstrap() {
  const app = await NestFactory.create(vehicleNewModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
