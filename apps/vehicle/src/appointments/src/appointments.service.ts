import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { CreateAppointmentDto } from './DTO/create-appointment.dto';
import { UpdateAppointmentDto } from './DTO/update-appointment.dto';
import { CreateTestDriveSlotDto } from './DTO/create-test-drive-slot.dto';
import { UpdateTestDriveSlotDto } from './DTO/update-test-drive-slot.dto';
import type { AppointmentResponseDto } from './DTO/appointment-response.dto';
@Injectable()
export class AppointmentsService {
  private supabase;
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  //hàm đặt lịch cho khách hàng
  async create(req, dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
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
      // ✅ RETURN THAY VÌ THROW
      this.logger.warn(`Slot ${dto.test_drive_slot_id} not found`);
      return {
        success: false,
        message: 'Lịch lái thử này không tồn tại hoặc đã bị xóa.',
        errorCode: 'SLOT_NOT_FOUND',
      };
    }

    // 2. Kiểm tra slot còn chỗ không
    if (slot.booked_customers >= slot.max_customers) {
      this.logger.debug(`Slot ${dto.test_drive_slot_id} is full`);
      return {
        success: false,
        message: 'Slot đã hết chỗ. Vui lòng chọn thời gian khác.',
        errorCode: 'SLOT_FULL',
      };
    }

    // 3. KIỂM TRA NGƯỜI DÙNG ĐÃ ĐẶT XE NÀY CHƯA
    const { data: existingAppointments, error: checkError } = await this.supabase
      .schema('product')
      .from('appointments')
      .select(
        `
      id,
      test_drive_slot_id,
      test_drive_slot:test_drive_slot_id (
        vehicle_id
      )
    `,
      )
      .eq('customer_uid', user.id)
      .in('status', ['confirm', 'confirmed', 'pending']);

    if (checkError) {
      throw new Error(`Failed to check existing appointments: ${checkError.message}`);
    }

    const targetVehicleId = slot.vehicle_id;
    const hasExistingBooking = existingAppointments?.some(
      (apt: any) => apt.test_drive_slot?.vehicle_id === targetVehicleId,
    );

    if (hasExistingBooking) {
      // ✅ RETURN THAY VÌ THROW
      this.logger.debug(`User ${user.id} already has appointment for vehicle ${targetVehicleId}`);
      return {
        success: false,
        message: 'Bạn đã đặt lịch lái thử xe này rồi. Vui lòng hủy lịch cũ trước khi đặt lại.',
        errorCode: 'DUPLICATE_APPOINTMENT',
      };
    }

    // 4. Tạo appointment
    const { data, error } = await this.supabase
      .schema('product')
      .from('appointments')
      .insert([{ ...dto, customer_uid: user.id, status: dto.status || 'confirm' }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    // 5. Update số người đã đặt
    await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .update({
        booked_customers: slot.booked_customers + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.test_drive_slot_id);

    this.logger.log(`Appointment created successfully - ID: ${data.id}, User: ${user.id}`);
    return {
      success: true,
      data: data,
      message: 'Đặt lịch thành công!',
    };
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
  //lấy chi tiết appointment với đầy đủ thông tin xe và hình ảnh
  async findOne(id: number) {
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
        vehicle:test_drive_slots_vehicle_fkey (
          id,
          name,
          tagline,
          model,
          version,
          year,
          color,
          fuel_type,
          transmission,
          engine,
          seats,
          mileage,
          origin,
          description,
          images:images_car_id_fkey (
            id,
            path,
            is_main
          )
        )
      )
    `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    //  Map hình ảnh thành URL public
    if (data.test_drive_slot?.vehicle?.images) {
      const { storage } = this.supabase;

      data.test_drive_slot.vehicle.images = data.test_drive_slot.vehicle.images.map((img) => ({
        ...img,
        url: storage.from('Vehicle').getPublicUrl(img.path).data.publicUrl,
      }));

      //  Thêm mainImage
      const mainImage = data.test_drive_slot.vehicle.images.find((img) => img.is_main);
      data.test_drive_slot.vehicle.mainImage = mainImage
        ? storage.from('Vehicle').getPublicUrl(mainImage.path).data.publicUrl
        : null;
    }

    return data;
  }

  //hàm cập nhật lịch hẹn
  async update(id: number, dto: UpdateAppointmentDto) {
    // Lấy appointment hiện tại
    const current = await this.findOne(id);

    // Nếu appointment đã completed thì không cho update nữa
    if (current.status === 'completed') {
      throw new Error('This appointment has already been completed and cannot be updated.');
    }

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
    // 1. Lấy appointment
    const apt = await this.findOne(id);

    // 2. Không cho delete nếu đã completed
    if (apt.status === 'completed') {
      throw new BadRequestException('Completed appointment cannot be deleted.');
    }

    // 3. Lấy slot tương ứng
    const slot = await this.findOneTD(apt.test_drive_slot_id);

    // 4. Xóa appointment trước
    const { error: deleteError } = await this.supabase
      .schema('product')
      .from('appointments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Failed to delete appointment: ${deleteError.message}`);
    }

    // 5. Không giảm nếu slot đã hidden
    if (slot.status !== 'hidden' && slot.booked_customers > 0) {
      const newBooked = slot.booked_customers - 1;

      const { error: updateError } = await this.supabase
        .schema('product')
        .from('test_drive_slots')
        .update({
          booked_customers: newBooked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slot.id);

      if (updateError) {
        throw new Error(`Failed to update slot: ${updateError.message}`);
      }
    }

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
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select(
        `
      *,
      vehicle:test_drive_slots_vehicle_fkey (
        id,
        name,
        model,
        year,
        images:images_car_id_fkey (
          path,
          is_main
        )
      )
    `,
      )
      .eq('status', 'open')
      .gte('slot_end', now)
      .order('slot_start', { ascending: true });

    if (error) {
      console.error('❌ Error fetching test drive slots:', error);
      throw new Error(error.message);
    }

    // map hình ảnh thành URL public
    const { storage } = this.supabase;

    return data.map((slot) => ({
      ...slot,
      vehicle: {
        ...slot.vehicle,
        images: slot.vehicle?.images?.map((img) => ({
          ...img,
          url: storage.from('Vehicle').getPublicUrl(img.path).data.publicUrl,
        })),
        mainImage: slot.vehicle?.images?.find((img) => img.is_main)
          ? storage
              .from('Vehicle')
              .getPublicUrl(slot.vehicle.images.find((img) => img.is_main).path).data.publicUrl
          : null,
      },
    }));
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

  // ✅ SỬA METHOD findOneTD
  async findOneTD(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .select(
        `
      *,
      vehicle:test_drive_slots_vehicle_fkey (
        id,
        name,
        model,
        version,
        year,
        color,
        fuel_type,
        transmission,
        images:images_car_id_fkey (
          path,
          is_main
        )
      ),
      appointments:appointments_test_drive_slot_fkey (
        id,
        customer_uid,
        status,
        created_at,
        updated_at
      )
    `,
      )
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Slot with ID ${id} not found`);

    // ✅ Map images to URLs
    if (data.vehicle?.images) {
      const { storage } = this.supabase;

      data.vehicle.images = data.vehicle.images.map((img) => ({
        ...img,
        url: storage.from('Vehicle').getPublicUrl(img.path).data.publicUrl,
      }));

      const mainImage = data.vehicle.images.find((img) => img.is_main);
      data.vehicle.mainImage = mainImage
        ? storage.from('Vehicle').getPublicUrl(mainImage.path).data.publicUrl
        : null;
    }

    // ✅ Sort appointments by created_at
    if (data.appointments) {
      data.appointments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return data;
  }

  // ✅ FILE: appointments.service.ts - SỬA METHOD updateTD

  async updateTD(id: number, dto: UpdateTestDriveSlotDto) {
    // Validate slot exists
    await this.findOneTD(id);

    // Update slot
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
    return this.findOneTD(id);
  }

  async reopenTD(id: number) {
    // 1. Kiểm tra slot có tồn tại không
    const slot = await this.findOneTD(id);

    // 2. Kiểm tra slot có đang ở trạng thái hidden không
    if (slot.status !== 'hidden') {
      throw new BadRequestException(
        `Cannot reopen slot. Current status is '${slot.status}'. Only 'hidden' slots can be reopened.`,
      );
    }

    // 3. Kiểm tra slot đã quá hạn chưa (optional - tùy logic nghiệp vụ)
    const now = new Date();
    if (new Date(slot.slot_end) < now) {
      throw new BadRequestException('Cannot reopen slot. This slot has already ended.');
    }

    // 4. Mở lại slot
    const { data, error } = await this.supabase
      .schema('product')
      .from('test_drive_slots')
      .update({
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reopen slot: ${error.message}`);
    }

    this.logger.log(`Slot ${id} has been reopened successfully`);

    return {
      message: 'Slot reopened successfully',
      slot: data,
    };
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
