import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, { cors: true });
  const port = Number(process.env.PORT) || 4100;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
