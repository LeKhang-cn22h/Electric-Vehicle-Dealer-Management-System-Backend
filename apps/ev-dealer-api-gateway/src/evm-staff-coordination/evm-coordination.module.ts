import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EvmCoordinationController } from './evm-coordination.controller';
import { EvmCoordinationService } from './evm-staff-coordination.service';
import { ServiceClients } from '../service-clients';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [EvmCoordinationController],
  providers: [EvmCoordinationService, ServiceClients],
  exports: [EvmCoordinationService],
})
export class EvmCoordinationModule {}
