import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';
import { ContractRequestController } from './evm-staff-agreement-service.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/evm-staff-agreement-service/.env', '.env'],
    }),
  ],
  providers: [EvmStaffAgreementServiceService],
  controllers: [ContractRequestController],
})
export class EvmAgreementModule {}
