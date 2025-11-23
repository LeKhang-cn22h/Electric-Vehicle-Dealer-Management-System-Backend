// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';
// import { ContractRequestController } from './evm-staff-agreement-service.controller';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//       envFilePath: ['apps/evm-staff-agreement-service/.env', '.env'],
//     }),
//   ],
//   providers: [EvmStaffAgreementServiceService],
//   controllers: [ContractRequestController],
// })
// export class EvmAgreementModule {}
// evm-staff-agreement.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';
import { EvmStaffAgreementController } from './evm-staff-agreement-service.controller';
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 giây
      maxRedirects: 5,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/evm-staff-agreement-service/.env', '.env'],
    }),
  ],
  controllers: [EvmStaffAgreementController],
  providers: [EvmStaffAgreementServiceService],
  exports: [EvmStaffAgreementServiceService],
})
export class EvmStaffAgreementModule {}
