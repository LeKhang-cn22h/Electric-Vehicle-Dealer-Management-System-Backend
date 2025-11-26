import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './DTO/create-appointment.dto';
import { UpdateAppointmentDto } from './DTO/update-appointment.dto';
import { Request } from 'express';
import { CreateTestDriveSlotDto } from './DTO/create-test-drive-slot.dto';
import { UpdateTestDriveSlotDto } from './DTO/update-test-drive-slot.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly as: AppointmentsService) {}

  // ===============================
  // APPOINTMENTS - CUSTOMER ROUTES (ĐẶT TRƯỚC)
  // ===============================

  //lịch sử đặt lái thử của khách (PHẢI ĐẶT TRƯỚC :id)
  @Get('history/customer')
  findAppointmentHistoryForCustomer(@Req() req) {
    return this.as.findAppointmentHistoryForCustomer(req);
  }

  //tạo lịch hẹn (khách đặt)
  @Post()
  create(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.as.create(req, dto);
  }

  // ===============================
  // APPOINTMENTS - ADMIN ROUTES
  // ===============================

  //lấy tất cả lịch hẹn (admin) - ĐẶT TRƯỚC :id
  @Get('all')
  findAll() {
    return this.as.findAll();
  }

  // ===============================
  // TEST DRIVE SLOTS - CUSTOMER ROUTES (ĐẶT TRƯỚC)
  // ===============================

  //lấy tất cả slot cho khách hàng - PHẢI ĐẶT TRƯỚC test-drive-slots/:id
  @Get('test-drive-slots/customer')
  findAllTDForCustomer() {
    return this.as.findAllTDForCustomer();
  }

  //lấy tất cả slot cho admin - PHẢI ĐẶT TRƯỚC test-drive-slots/:id
  @Get('test-drive-slots/admin')
  findAllTDForAdmin() {
    return this.as.findAllTDForAdmin();
  }

  // ===============================
  // TEST DRIVE SLOTS - CRUD
  // ===============================

  //tạo slot lái thử (admin)
  @Post('test-drive-slots')
  createTD(@Body() dto: CreateTestDriveSlotDto) {
    return this.as.createTD(dto);
  }

  //lấy chi tiết 1 slot lái thử - ĐẶT SAU các route cụ thể
  @Get('test-drive-slots/:id')
  findOneTD(@Param('id', ParseIntPipe) id: number) {
    return this.as.findOneTD(id);
  }

  //cập nhật slot lái thử
  @Put('test-drive-slots/:id')
  updateTD(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestDriveSlotDto) {
    return this.as.updateTD(id, dto);
  }
  //mở lại slot lái thử đã đóng (admin)
  @Patch('test-drive-slots/:id/reopen')
  async reopenTestDriveSlot(@Param('id') id: string) {
    return this.as.reopenTD(+id);
  }

  //xóa mềm slot lái thử
  @Delete('test-drive-slots/:id')
  removeTD(@Param('id', ParseIntPipe) id: number) {
    return this.as.removeTD(id);
  }

  // ===============================
  // APPOINTMENTS - CRUD (ĐẶT CUỐI)
  // ===============================

  //lấy chi tiết 1 lịch hẹn - ĐẶT SAU tất cả route cụ thể
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.as.findOne(id);
  }

  //cập nhật lịch hẹn
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto) {
    return this.as.update(id, dto);
  }

  //xóa lịch hẹn
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.as.remove(id);
  }
}
