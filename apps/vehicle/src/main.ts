import { NestFactory } from '@nestjs/core';
import { VehicleModule } from './vehicle.module';
import { ConfigModule } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(VehicleModule);
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  });
  app.enableCors();
  await app.listen(process.env.PORT || 4001);
}
bootstrap();
