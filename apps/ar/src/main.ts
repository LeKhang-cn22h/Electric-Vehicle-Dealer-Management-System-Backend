import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './ar.module';
import { ConfigModule } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  });
  const port = Number(process.env.PORT || 4400);
  await app.listen(port);
}
bootstrap();
