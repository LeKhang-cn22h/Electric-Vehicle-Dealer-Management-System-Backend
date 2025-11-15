// src/dealer-agreement/dealer-agreement-service.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DealerAgreementController } from './dealer-agreement-service.controller';
import { DealerAgreementService } from './dealer-agreement-service.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [DealerAgreementController],
  providers: [DealerAgreementService],
})
export class DealerAgreementServiceModule {}
