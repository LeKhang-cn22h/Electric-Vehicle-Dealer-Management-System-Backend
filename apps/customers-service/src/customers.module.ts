import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/customers-service/.env', // <- bắt buộc phải trỏ đúng
    }),
  ],
  exports: [CustomersService],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
