import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './car.controller';
import { ProductService } from './car.service';
import { Product } from './car.entity';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [TypeOrmModule.forFeature([Product])],
  exports: [TypeOrmModule],
})
export class ProductModule {}
