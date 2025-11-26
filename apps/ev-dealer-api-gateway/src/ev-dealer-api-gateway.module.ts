import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
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
import { GatewaySalesController } from './routes/gateway-sales.controller';
import { GatewayEvmStaffAgreementController } from './routes/gateway-evm-staff-agreement-service.controller';
import { rateLimitConfigs } from './middlewares/rateLimiter';

import { InventoryGatewayController } from './routes/inventory-gateway.controller';
@Module({
  imports: [HttpModule.register({ timeout: 160000 })],
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
    GatewayARController,
    GatewayRbacController,
    CommissionGatewayController,
    GatewayEvmStaffAgreementController,
    InventoryGatewayController,
  ],
})
export class EvDealerApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // tầng 1 dành cho auth giới hạn là 5 req/5 phút
    // dưới là ví dụ
    consumer
      .apply(rateLimitConfigs.auth)
      .forRoutes({ path: 'api/auth/login', method: RequestMethod.POST });

    // tầng 2 dành cho payment
    // dưới là ví dụ
    consumer
      .apply(rateLimitConfigs.payment)
      .forRoutes({ path: 'api/billing/payments/create', method: RequestMethod.POST });

    // tầng 3 dành cho write
    consumer
      .apply(rateLimitConfigs.write)
      .forRoutes(
        { path: 'api/vehicle', method: RequestMethod.POST },
        { path: 'api/vehicle/:id', method: RequestMethod.PUT },
        { path: 'api/vehicle/:id', method: RequestMethod.DELETE },
        { path: 'api/vehicle/compare', method: RequestMethod.POST },
        { path: 'api/vehicle/Vunit', method: RequestMethod.POST },
        { path: 'api/vehicle/list', method: RequestMethod.POST },
        { path: 'api/vehicle/appointments', method: RequestMethod.POST },
        { path: 'api/vehicle/appointments/:id', method: RequestMethod.PUT },
        { path: 'api/vehicle/appointments/:id', method: RequestMethod.DELETE },
        { path: 'api/vehicle/test-drive-slots', method: RequestMethod.POST },
        { path: 'api/vehicle/test-drive-slots/:id', method: RequestMethod.PUT },
        { path: 'api/vehicle/test-drive-slots/:id', method: RequestMethod.DELETE },
      );

    // tầng 4 dành cho search
    consumer
      .apply(rateLimitConfigs.search)
      .forRoutes(
        { path: 'api/vehicle/filter/model', method: RequestMethod.GET },
        { path: 'api/vehicle/search', method: RequestMethod.GET },
      );

    // tầng 5 dành cho read
    consumer
      .apply(rateLimitConfigs.read)
      .forRoutes(
        { path: 'api/vehicle', method: RequestMethod.GET },
        { path: 'api/vehicle/:id', method: RequestMethod.GET },
        { path: 'api/vehicle/:id/compare-suggestions', method: RequestMethod.GET },
        { path: 'api/vehicle/new-arrivals', method: RequestMethod.GET },
        { path: 'api/vehicle/:id/similar', method: RequestMethod.GET },
        { path: 'api/vehicle/appointments/history/customer', method: RequestMethod.GET },
        { path: 'api/vehicle/appointments/all', method: RequestMethod.GET },
        { path: 'api/vehicle/appointments/:id', method: RequestMethod.GET },
        { path: 'api/vehicle/test-drive-slots', method: RequestMethod.GET },
        { path: 'api/vehicle/test-drive-slots/admin', method: RequestMethod.GET },
        { path: 'api/vehicle/test-drive-slots/:id', method: RequestMethod.GET },
      );
    // tầng 6 dành cho public
    consumer
      .apply(rateLimitConfigs.public)
      .forRoutes({ path: 'api/vehicle/models', method: RequestMethod.GET });
  }
}
