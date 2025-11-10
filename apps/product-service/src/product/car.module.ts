import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMessageController } from './car.mesage.controller';
import { ProductService } from './car.service';
import { Product } from './car.entity';

@Module({
  controllers: [ProductMessageController],
  providers: [ProductService],
  imports: [TypeOrmModule.forFeature([Product])],
  exports: [TypeOrmModule],
})
export class ProductModule {}
