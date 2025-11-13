import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceClients } from './service-clients';
import { GatewayAuthController } from './routes/gateway-auth.controller';
import { GatewayUsersController } from './routes/gateway-users.controller';
import { GatewayDealerCoordinationController } from './routes/gateway-dealer-coordination.controller';
import { GatewayVehicleController } from './routes/gateway-vehicle.controller';
import { GatewayCustomersController } from './routes/gateway-customers.controller';
// import { GatewayBillingController } from './routes/gateway-billing.controller';
import { GatewayEvmStaffCoordinationController } from './routes/gateway-evm-staff-coordination.controller';
@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [ServiceClients],
  controllers: [
    GatewayAuthController,
    GatewayUsersController,
    GatewayDealerCoordinationController,
    GatewayVehicleController,
    GatewayCustomersController,
    // GatewayBillingController,
    GatewayEvmStaffCoordinationController,
  ],
})
export class EvDealerApiGatewayModule {}
