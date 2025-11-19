import { NestFactory } from '@nestjs/core';
import { VehicleModule } from './vehicle.module';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(VehicleModule);

  // Cấu hình env
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  });

  // Bật CORS
  app.enableCors();

  // ✅ Bật ValidationPipe toàn cục để NestJS validate DTO và map kiểu
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // chỉ lấy những property trong DTO
      forbidNonWhitelisted: true, // lỗi nếu có property lạ
      transform: true, // map tự động kiểu dữ liệu, ví dụ string → number
    }),
  );

  await app.listen(process.env.PORT || 4001);
}
bootstrap();
