import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { SupabaseService } from 'vehicle/supabase/supabase.service';
import { AppointmentsModule } from './appointments/src/appointments.module';
import { vehicleNewModule } from './vehicle-new/src/vehicle-new.module';
import { SupabaseModule } from 'vehicle/supabase/supabase.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/vehicle/.env',
    }),
    SupabaseModule,
    vehicleNewModule,
    AppointmentsModule,

    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'vehicle_exchange',
          type: 'direct',
        },
      ],
      uri: process.env.RABBITMQ_URI,
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService, SupabaseService],
})
export class VehicleModule {}
