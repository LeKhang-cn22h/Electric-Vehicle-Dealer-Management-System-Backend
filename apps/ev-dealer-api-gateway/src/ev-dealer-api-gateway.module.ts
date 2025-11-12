import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceClients } from './service-clients';
import { GatewayAuthController } from './routes/gateway-auth.controller';
import { GatewayUsersController } from './routes/gateway-users.controller';
import { GatewayDealerCoordinationController } from './routes/gateway-dealer-coordination.controller';
// import { GatewayBillingController } from './routes/gateway-billing.controller';
import { GatewayEvmStaffCoordinationController } from './routes/gateway-evm-staff-coordination.controller';
@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [ServiceClients],
  controllers: [
    GatewayAuthController,
    GatewayUsersController,
    GatewayDealerCoordinationController,
    // GatewayBillingController,
    GatewayEvmStaffCoordinationController,
  ],
})
export class EvDealerApiGatewayModule {}
