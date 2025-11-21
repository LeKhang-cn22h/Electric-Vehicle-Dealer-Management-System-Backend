import { Module } from '@nestjs/common';
import { vehicleNewController } from './vehicle-new.controller';
import { vehicleNewService } from './vehicle-new.service';

@Module({
  imports: [],
  controllers: [vehicleNewController],
  providers: [vehicleNewService],
})
export class vehicleNewModule {}
