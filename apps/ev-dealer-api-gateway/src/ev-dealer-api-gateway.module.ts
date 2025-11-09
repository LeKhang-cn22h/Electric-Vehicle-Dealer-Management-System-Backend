import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceClients } from './service-clients';
import { GatewayAuthController } from './routes/gateway-auth.controller';
import { EvmCoordinationService } from './evm-staff-coordination/evm-staff-coordination.service';

@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [ServiceClients, EvmCoordinationService],
  controllers: [GatewayAuthController],
})
export class EvDealerApiGatewayModule {}
