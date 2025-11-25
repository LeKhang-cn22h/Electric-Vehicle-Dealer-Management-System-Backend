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
// apps/evm-staff-agreement-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EvmStaffAgreementController } from './evm-staff-agreement-service.controller';
import { EvmStaffAgreementServiceService } from './evm-staff-agreement-service.service';
import { NotificationService } from './notification/notification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/evm-staff-agreement-service/.env', '.env'],
    }),
    HttpModule,
  ],
  controllers: [EvmStaffAgreementController],
  providers: [
    EvmStaffAgreementServiceService,
    NotificationService, // ← Add here
  ],
})
export class EvmStaffAgreementModule {}
