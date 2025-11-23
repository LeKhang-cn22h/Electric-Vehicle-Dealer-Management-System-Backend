import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { CreateAppointmentDto } from './DTO/create-appointment.dto';
import { UpdateAppointmentDto } from './DTO/update-appointment.dto';
import { CreateTestDriveSlotDto } from './DTO/create-test-drive-slot.dto';
import { UpdateTestDriveSlotDto } from './DTO/update-test-drive-slot.dto';
@Injectable()
export class AppointmentsService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  //hàm đặt lịch cho khách hàng
  async create(req, dto: CreateAppointmentDto) {
    const user = await this.supabaseService.getUserFromRequest(req);
    if (!user) throw new Error('Unauthorized: Token missing or invalid');
    // 1. Kiểm tra slot có tồn tại không
    const { data: slot, error: slotError } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select('*')
      .eq('id', dto.test_drive_slot_id)
      .single();

    if (slotError || !slot) {
      throw new NotFoundException(`Slot ${dto.test_drive_slot_id} not found`);
    }

    // 2. Kiểm tra slot còn chỗ không
    if (slot.booked_customers >= slot.max_customers) {
      throw new BadRequestException('Slot is already full');
    }

    // 3. Tạo appointment
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .insert([{ ...dto, customer_uid: user.id, status: dto.status || 'pending' }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    // 4. Update số người đã đặt
    await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .update({
        booked_customers: slot.booked_customers + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.test_drive_slot_id);

    return data;
  }

  //lấy toàn bộ lịch khách
  async findAll() {
    try {
      // Lấy appointments trước
      const { data: appointments, error: appointmentsError } = await this.supabase
        .schema('product')
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Lấy test_drive_slots riêng
      const slotIds = appointments.map((apt) => apt.test_drive_slot_id).filter(Boolean);

      if (slotIds.length > 0) {
        const { data: slots, error: slotsError } = await this.supabase
          .schema('product')
          .from('test_drive_slots')
          .select(
            `
          id,
          slot_start,
          slot_end,
          max_customers,
          booked_customers,
          vehicle:vehicle_id (
            id, name, model, version, color, year
          )
        `,
          )
          .in('id', slotIds);

        if (slotsError) throw slotsError;

        // Merge data manually
        const slotsMap = new Map(slots.map((slot) => [slot.id, slot]));
        return appointments.map((apt) => ({
          ...apt,
          test_drive_slot: slotsMap.get(apt.test_drive_slot_id) || null,
        }));
      }

      return appointments;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
  }
  //lịch đặt lái thử của mình
  async findAppointmentHistoryForCustomer(req) {
    const user = await this.supabaseService.getUserFromRequest(req);
    if (!user) throw new Error('Unauthorized: Token missing or invalid');

    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .select(
        `
      *,
      test_drive_slot:test_drive_slot_id (
        id,
        slot_start,
        slot_end,
        max_customers,
        booked_customers,
        status,
        vehicle:vehicle_id (
          id, name, model, version, color, year
        )
      )
    `,
      )
      .eq('customer_uid', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch appointment history: ${error.message}`);
    return data;
  }

  //lấy chi tiết
  async findOne(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return data;
  }

  //hàm cập nhật lịch hẹn
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

  //hàm xóa lịch hẹn
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

  //phần quản lý lịch lái thử

  async createTD(dto: CreateTestDriveSlotDto) {
    if (new Date(dto.slot_end) <= new Date(dto.slot_start)) {
      throw new BadRequestException('slot_end must be greater than slot_start');
    }

    const { data: conflicts } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select('*')
      .eq('vehicle_id', dto.vehicle_id)
      .not('slot_end', 'lte', dto.slot_start) // old_end > new_start
      .not('slot_start', 'gte', dto.slot_end); // old_start < new_end

    if (conflicts?.length) {
      throw new BadRequestException('This vehicle already has a slot overlapping this time');
    }

    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .insert([
        {
          ...dto,
          booked_customers: 0,
          status: 'open',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`Failed to create slot: ${error.message}`);
    return data;
  }

  async findAllTDForCustomer() {
    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select(
        `
      *,
      vehicle:vehicle_id (
        id, name, model, version, year, color
      )
    `,
      )
      .eq('status', 'available')
      .order('slot_start', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }
  async findAllTDForAdmin() {
    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select(
        `
      *,
      vehicle:vehicle_id (
        id, name, model, version, year, color
      )
    `,
      )
      .order('slot_start', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async findOneTD(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Slot with ID ${id} not found`);
    return data;
  }

  async updateTD(id: number, dto: UpdateTestDriveSlotDto) {
    await this.findOne(id);

    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update slot: ${error.message}`);
    return data;
  }

  async removeTD(id: number) {
    const slot = await this.findOneTD(id);

    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .update({
        status: 'hidden', // 👉 Xóa mềm: chuyển trạng thái
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to hide slot: ${error.message}`);
    }

    return { message: 'Slot hidden successfully', slot: data };
  }
}
