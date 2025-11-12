import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dtos/create-bill.dto';
import { ListBillsDto } from './dtos/list-bills.dto';

@Controller('bills')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Post()
  create(@Body() dto: CreateBillDto, @Headers('Idempotency-Key') key?: string) {
    return this.svc.create(dto, key);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/void')
  void(@Param('id') id: string) {
    return this.svc.void(id);
  }

  @Post(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.svc.markPaid(id);
  }

  @Get()
  list(@Query() q: ListBillsDto) {
    return this.svc.list(q);
  }
}
