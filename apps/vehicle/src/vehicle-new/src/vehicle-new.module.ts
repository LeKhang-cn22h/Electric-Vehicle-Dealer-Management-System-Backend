import { Module } from '@nestjs/common';
import { vehicleNewController } from './vehicle-new.controller';
import { vehicleNewService } from './vehicle-new.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [RabbitMQModule],
  controllers: [vehicleNewController],
  providers: [vehicleNewService],
})
export class vehicleNewModule {}
