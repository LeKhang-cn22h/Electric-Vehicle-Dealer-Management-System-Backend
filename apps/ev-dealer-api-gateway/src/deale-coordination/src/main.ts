import { NestFactory } from '@nestjs/core';
import { DealeCoordinationModule } from './deale-coordination.module';

async function bootstrap() {
  const app = await NestFactory.create(DealeCoordinationModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
