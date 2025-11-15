import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ConfigModule } from '@nestjs/config';
import { ArController } from './ar.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/ar/.env',
    }),
  ],
  controllers: [ArController],
  providers: [ArService],
})
export class AppModule {}
