import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServiceClients } from './service-clients';
import { GatewayAuthController } from './routes/gateway-auth.controller';
import { GatewayUsersController } from './routes/gateway-users.controller';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [ServiceClients, ProductService],
  controllers: [GatewayAuthController, GatewayUsersController, ProductController],
})
export class EvDealerApiGatewayModule {}
