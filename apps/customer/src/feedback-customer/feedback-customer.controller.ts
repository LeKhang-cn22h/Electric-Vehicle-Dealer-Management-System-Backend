import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FeedbackCustomerService } from './feedback-customer.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';

@Controller('feedback-customer')
export class FeedbackCustomerController {
  constructor(private readonly feedbackCustomerService: FeedbackCustomerService) {}

  @Post()
  async create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackCustomerService.createFeedback(createFeedbackDto);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('customer_id', new ParseIntPipe({ optional: true })) customer_id?: number,
  ) {
    return this.feedbackCustomerService.findAllFeedbacks(status, customer_id);
  }

  @Get('stats')
  async getStats() {
    return this.feedbackCustomerService.getFeedbackStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackCustomerService.findFeedbackById(id);
  }

  @Get('customer/:customer_id')
  async findByCustomer(@Param('customer_id', ParseIntPipe) customer_id: number) {
    return this.feedbackCustomerService.getFeedbacksByCustomer(customer_id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbackCustomerService.updateFeedback(id, updateFeedbackDto);
  }

  @Put(':id/reply')
  async reply(@Param('id', ParseIntPipe) id: number, @Body() replyFeedbackDto: ReplyFeedbackDto) {
    return this.feedbackCustomerService.replyToFeedback(id, replyFeedbackDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackCustomerService.deleteFeedback(id);
  }
}
