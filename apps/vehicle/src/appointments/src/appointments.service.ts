import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { CreateAppointmentDto } from './DTO/create-appointment.dto';
import { UpdateAppointmentDto } from './DTO/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async create(dto: CreateAppointmentDto) {
    // 2️⃣ Lưu appointment
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .insert([
        {
          ...dto,
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
