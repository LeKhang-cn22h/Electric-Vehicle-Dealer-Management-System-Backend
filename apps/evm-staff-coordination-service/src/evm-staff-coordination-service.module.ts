import { Module } from '@nestjs/common';
import { EvmStaffCoordinationController } from './evm-staff-coordination-service.controller';
import { EvmStaffCoordinationService } from './evm-staff-coordination-service.service';

@Module({
  imports: [],
  controllers: [EvmStaffCoordinationController],
  providers: [EvmStaffCoordinationService],
})
export class EvmStaffCoordinationServiceModule {}
