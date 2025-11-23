import { Controller, Get, Post, Put, Delete, Param, Body, Req, ParseIntPipe } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './DTO/create-appointment.dto';
import { UpdateAppointmentDto } from './DTO/update-appointment.dto';
import { Request } from 'express';
import { CreateTestDriveSlotDto } from './DTO/create-test-drive-slot.dto';
import { UpdateTestDriveSlotDto } from './DTO/update-test-drive-slot.dto';
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly as: AppointmentsService) {}

  // tạo lịch hẹn (khách đặt)
  @Post()
  create(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.as.create(req, dto);
  }

  // lấy tất cả lịch hẹn (admin)
  @Get('all')
  findAll() {
    return this.as.findAll();
  }

  // lấy chi tiết 1 lịch hẹn
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.as.findOne(id);
  }

  // cập nhật lịch hẹn
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto) {
    return this.as.update(id, dto);
  }

  // xóa lịch hẹn
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.as.remove(id);
  }

  // lịch sử đặt lái thử của khách
  @Get('history/customer')
  findAppointmentHistoryForCustomer(@Req() req) {
    return this.as.findAppointmentHistoryForCustomer(req);
  }
  // tạo slot lái thử (admin)
  @Post('test-drive-slots')
  createTD(@Body() dto: CreateTestDriveSlotDto) {
    return this.as.createTD(dto);
  }

  // lấy tất cả slot lái thử cho khách hàng (chỉ available)
  @Get('test-drive-slots/customer')
  findAllTDForCustomer() {
    return this.as.findAllTDForCustomer();
  }

  // lấy tất cả slot lái thử cho admin (tất cả trạng thái)
  @Get('test-drive-slots/admin')
  findAllTDForAdmin() {
    return this.as.findAllTDForAdmin();
  }

  // lấy chi tiết 1 slot lái thử
  @Get('test-drive-slots/:id')
  findOneTD(@Param('id', ParseIntPipe) id: number) {
    return this.as.findOneTD(id);
  }

  // cập nhật slot lái thử
  @Put('test-drive-slots/:id')
  updateTD(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestDriveSlotDto) {
    return this.as.updateTD(id, dto);
  }

  // xóa mềm slot lái thử (chuyển status thành hidden)
  @Delete('test-drive-slots/:id')
  removeTD(@Param('id', ParseIntPipe) id: number) {
    return this.as.removeTD(id);
  }
}
