import { Module } from '@nestjs/common';
import { EvDealerApiGatewayController } from './ev-dealer-api-gateway.controller';
import { EvDealerApiGatewayService } from './ev-dealer-api-gateway.service';
import { UsersModule } from './users/users.module';
import { CoordinationModule } from './coordination/coordination.module';

@Module({
  imports: [UsersModule, CoordinationModule],
  controllers: [EvDealerApiGatewayController],
  providers: [EvDealerApiGatewayService],
})
export class EvDealerApiGatewayModule {}
