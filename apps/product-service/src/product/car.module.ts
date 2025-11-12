import { Module } from '@nestjs/common';
import { ProductController } from './car.controller';
import { ProductService } from './car.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // đường dẫn tới file .env
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
