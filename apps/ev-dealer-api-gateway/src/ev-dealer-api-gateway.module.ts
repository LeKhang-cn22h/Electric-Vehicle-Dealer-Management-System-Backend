import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceClients } from './service-clients';
import { GatewayAuthController } from './routes/gateway-auth.controller';
import { GatewayUsersController } from './routes/gateway-users.controller';

@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [ServiceClients],
  controllers: [GatewayAuthController, GatewayUsersController],
})
export class EvDealerApiGatewayModule {}
