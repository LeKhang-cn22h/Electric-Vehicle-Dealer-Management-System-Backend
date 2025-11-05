import { Module } from '@nestjs/common';
import { EvDealerApiGatewayController } from './ev-dealer-api-gateway.controller';
import { EvDealerApiGatewayService } from './ev-dealer-api-gateway.service';
import { UsersModule } from './users/users.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [UsersModule, SalesModule],
  controllers: [EvDealerApiGatewayController],
  providers: [EvDealerApiGatewayService],
})
export class EvDealerApiGatewayModule {}
