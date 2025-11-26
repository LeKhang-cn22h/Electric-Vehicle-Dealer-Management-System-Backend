// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';
// import { EvmStaffCoordinationController } from './evm-staff-coordination-service.controller';
// @Module({
// imports: [
//   ConfigModule.forRoot({
//     isGlobal: true, // giúp ConfigService dùng được mọi nơi mà không cần import lại
//     envFilePath: '.env', // nếu file nằm ở thư mục gốc service, hoặc khai báo đúng đường dẫn
//   }),
// ],
//   controllers: [EvmStaffCoordinationController],
//   providers: [EvmStaffCoordinationService],
//   exports: [EvmStaffCoordinationService],
// })
// export class EvmStaffCoordinationModule {}
// src/evm-staff-coordination-service.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvmStaffCoordinationServiceController } from './evm-staff-coordination-service.controller';
import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // giúp ConfigService dùng được mọi nơi mà không cần import lại
      envFilePath: '.env', // nếu file nằm ở thư mục gốc service, hoặc khai báo đúng đường dẫn
    }),
    SupabaseModule,
  ],
  controllers: [EvmStaffCoordinationServiceController],
  providers: [EvmStaffCoordinationService],
  exports: [EvmStaffCoordinationService],
})
export class EvmStaffCoordinationServiceModule {}
