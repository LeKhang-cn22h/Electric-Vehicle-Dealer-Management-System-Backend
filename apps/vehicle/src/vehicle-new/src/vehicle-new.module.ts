import { Module } from '@nestjs/common';
import { vehicleNewController } from './vehicle-new.controller';
import { vehicleNewService } from './vehicle-new.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'vehicle_exchange',
          type: 'direct',
        },
        {
          name: 'quotation_vehicle',
          type: 'direct',
        },
        {
          name: 'order_vehicle',
          type: 'direct',
        },
        {
          name: 'contract_vehicle',
          type: 'direct',
        },
      ],
      uri: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      connectionInitOptions: {
        wait: false,
      },
    }),
  ],
  controllers: [vehicleNewController],
  providers: [vehicleNewService],
})
export class vehicleNewModule {}
