// src/dealer-agreement/dealer-agreement-service.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DealerAgreementController } from './dealer-agreement.controller';
import { DealerAgreementService } from './dealer-agreement.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/dealer-agreement/.env', '.env'],
    }),
  ],

  controllers: [DealerAgreementController],
  providers: [DealerAgreementService],
})
export class DealerAgreementServiceModule {}
