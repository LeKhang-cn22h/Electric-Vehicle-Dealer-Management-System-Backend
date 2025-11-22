import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { Quotation } from './entity/quotation.entity';

@Controller('quotations')
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  create(@Body() dto: CreateQuotationDto) {
    return this.quotationService.create(dto);
  }

  @Get()
  findAll() {
    return this.quotationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationService.findOne(id);
  }

  @Get('creator/:id')
  findAllByCreator(@Param('id') id: string) {
    return this.quotationService.findAllByCreator(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Quotation>) {
    return this.quotationService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationService.remove(id);
  }
}
