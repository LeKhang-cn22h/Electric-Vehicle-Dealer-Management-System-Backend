import { NestFactory } from '@nestjs/core';
import { RbacModule } from './rbac.module';

async function bootstrap() {
  const app = await NestFactory.create(RbacModule);
  await app.listen(process.env.PORT ?? 4600);
}
bootstrap();
