import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
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

  // @Post()
  // create(@Body() dto: CreateBillDto, @Headers('Idempotency-Key') key?: string) {
  //   return this.svc.create(dto, key);
  // }

  @Post()
  async create(@Body() dto: CreateBillDto, @Headers('Idempotency-Key') idempotencyKey?: string) {
    console.log('[BillingController] DTO nhận từ FE:', JSON.stringify(dto, null, 2));
    return this.svc.create(dto, idempotencyKey);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/void')
  void(@Param('id') id: string) {
    return this.svc.void(id);
  }

  @Patch(':id/paid')
  markPaid(@Param('id') id: string) {
    return this.svc.markPaid(id);
  }

  @Get()
  list(@Query() q: ListBillsDto) {
    return this.svc.list(q);
  }
}
