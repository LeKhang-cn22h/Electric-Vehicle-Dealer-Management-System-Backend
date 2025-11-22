import { Controller, Get, Post, Param, Patch, Delete, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entity/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  //Tạo đơn hàng từ báo giá
  @Post('create')
  async createFromQuotation(@Body() createOrdertion: CreateOrderDto): Promise<Order> {
    return this.orderService.createFromQuotation(createOrdertion);
  }

  //Lấy tất cả đơn hàng
  @Post()
  async findAll(@Body() filters: any): Promise<any> {
    return this.orderService.findAll(filters);
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
