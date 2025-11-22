import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAppointmentDto } from './DTO/create-appointment.dto';
import { UpdateAppointmentDto } from './DTO/update-appointment.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { SupabaseService } from 'vehicle/supabase/supabase.service';

@Injectable()
export class AppointmentsService {
  private supabase;

  constructor(
    private supabaseService: SupabaseService,
    private readonly amqpConnection: AmqpConnection, // để gọi Auth service
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  /** Gọi Auth service để lấy UID từ token */
  private async getUidFromToken(token: string): Promise<number> {
    if (!token) throw new BadRequestException('Token is required');
    try {
      const uid = await this.amqpConnection.request<number>({
        exchange: 'auth_exchange',
        routingKey: 'get_uid_by_token',
        payload: { token },
        timeout: 10000,
      });
      return uid;
    } catch (err) {
      throw new BadRequestException(`Failed to get UID from token: ${err.message}`);
    }
  }

  async create(dto: CreateAppointmentDto & { adminToken: string; customerToken: string }) {
    // 1️⃣ Lấy UID từ token
    const admin_uid = await this.getUidFromToken(dto.adminToken);
    const customer_uid = await this.getUidFromToken(dto.customerToken);

    // 2️⃣ Lưu appointment
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .insert([
        {
          ...dto,
          admin_uid,
          customer_uid,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`Failed to create appointment: ${error.message}`);
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .select(
        `*,
        vehicle:vehicle_id (id, name, model, version)`,
      )
      .order('appointment_time', { ascending: true });

    if (error) throw new Error(`Failed to fetch appointments: ${error.message}`);
    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException(`Appointment with ID ${id} not found`);
    return data;
  }

  async update(id: number, dto: UpdateAppointmentDto) {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update appointment: ${error.message}`);
    return data;
  }

  async remove(id: number) {
    await this.findOne(id);

    const { error } = await this.supabase
      .schema('product')
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete appointment: ${error.message}`);
    return { message: 'Appointment deleted successfully' };
  }
}
