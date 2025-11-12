import { Controller, Get, Post, Param, Patch, Delete, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entity/order.entity';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  //Tạo đơn hàng từ báo giá
  @Post('from-quotation/:quotationId')
  async createFromQuotation(@Param('quotationId') quotationId: string): Promise<Order> {
    return this.orderService.createFromQuotation(quotationId);
  }

  //Lấy tất cả đơn hàng
  @Get()
  async findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  //Lấy đơn hàng theo ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Order> {
    return this.orderService.findOne(id);
  }

  //Cập nhật đơn hàng
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<Order>): Promise<Order> {
    return this.orderService.update(id, updateData);
  }

  //Xoá đơn hàng
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.orderService.remove(id);
  }
}
