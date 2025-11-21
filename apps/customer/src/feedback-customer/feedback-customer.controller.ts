import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, Req } from '@nestjs/common';
import { FeedbackCustomerService } from './feedback-customer.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('feedback-customer')
export class FeedbackCustomerController {
  constructor(private readonly feedbackCustomerService: FeedbackCustomerService) {}
  //tạo
  @Post()
  async create(@Req() req, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackCustomerService.createFeedback(req, createFeedbackDto);
  }
  //lấy tất cả cho admin
  @Get()
  async findAll() {
    return this.feedbackCustomerService.findAllFeedbacks();
  }
  //lất tất cả cho customer
  @Get('customer')
  async findAllCustomer(@Req() req) {
    return this.feedbackCustomerService.findAllFeedbacksCustomer(req);
  }
  // get cụ thể feedback
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackCustomerService.findFeedbackById(id);
  }

  @Put(':id/reply')
  async update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbackCustomerService.updateFeedback(req, id, updateFeedbackDto);
  }
  //xóa
  @Put('delete/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackCustomerService.deleteFeedback(id);
  }
}
