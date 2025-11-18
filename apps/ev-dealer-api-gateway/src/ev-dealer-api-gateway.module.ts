import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceClients } from './service-clients';
import { GatewayAuthController } from './routes/gateway-auth.controller';
import { GatewayUsersController } from './routes/gateway-users.controller';
import { GatewayDealerCoordinationController } from './routes/gateway-dealer-coordination.controller';
import { GatewayVehicleController } from './routes/gateway-vehicle.controller';
import { GatewayCustomersController } from './routes/gateway-customers.controller';
import { GatewayBillingController } from './routes/gateway-billing.controller';
import { GatewayEvmStaffCoordinationController } from './routes/gateway-evm-staff-coordination.controller';
import { GatewayARController } from './routes/gateway-ar.controller';
import { GatewayRbacController } from './routes/gateway-rbac.controller';
import { CommissionGatewayController } from './routes/gateway-commission.controller';
import { GatewayDealerAgreementController } from './routes/gateway-dealer-agreement.controller';
import { slidingWindow } from './middlewares/rateLimiter';
import { GatewaySalesController } from './routes/gateway-sales.controller';
@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [ServiceClients],
  controllers: [
    GatewayAuthController,
    GatewayUsersController,
    GatewayDealerCoordinationController,
    GatewayVehicleController,
    GatewayCustomersController,
    GatewayBillingController,
    GatewayEvmStaffCoordinationController,
    GatewayDealerAgreementController,
    GatewaySalesController,
  ],
})
export class EvDealerApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(slidingWindow(10, 60)) // limit 10 req/60s
      .forRoutes('*');
  }
}
