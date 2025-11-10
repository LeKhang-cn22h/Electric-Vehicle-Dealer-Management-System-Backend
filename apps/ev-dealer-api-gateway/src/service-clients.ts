import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class ServiceClients implements OnModuleInit {
  authService: ClientProxy;
  usersService: ClientProxy;
  evmCoordinationService: ClientProxy;
  dealerCoordinationService: ClientProxy;
  productService: ClientProxy;
  customerService: ClientProxy;
  onModuleInit() {
    this.authService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.AUTH_TCP_PORT) || 4100,
      },
    });

    this.usersService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.USERS_TCP_PORT) || 4200,
      },
    });

    this.evmCoordinationService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.EVM_COORDINATION_TCP_PORT) || 3002,
      },
    });

    this.dealerCoordinationService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.DEALER_COORDINATION_TCP_PORT) || 3001,
      },
    });
    this.productService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.PRODUCT_TCP_PORT) || 3600,
      },
    });
    this.customerService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: Number(process.env.CUSTOMER_TCP_PORT) || 4300,
      },
    });
  }

  // helper gửi message
  send(service: ClientProxy, pattern: any, data: any) {
    return service.send(pattern, data);
  }
}
