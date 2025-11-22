// vehicle.module.ts
import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { SupabaseModule } from '../supabase/supabase.module';
import { AppointmentsModule } from './appointments/src/appointments.module';
import { vehicleNewModule } from './vehicle-new/src/vehicle-new.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/vehicle/.env' }),
    RabbitMQModule.forRoot({
      exchanges: [{ name: 'vehicle_exchange', type: 'direct' }],
      uri: process.env.RABBITMQ_URI,
      connectionInitOptions: { wait: false },
    }),
    SupabaseModule,
    AppointmentsModule,
    vehicleNewModule,
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService, RabbitMQModule],
})
export class VehicleModule {}
