import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('api/vehicle')
export class GatewayCustomersController {
  private readonly logger = new Logger(GatewayCustomersController.name);

  constructor(private readonly c: ServiceClients) {}

  @Get()
  async findAll() {
    try {
      this.logger.log('🔍 Calling vehicle service GET ');
      const result = await this.c.vehicle().get('/customer');
      this.logger.log('✅ Success, got data:', JSON.stringify(result).slice(0, 100));
      return result;
    } catch (error) {
      this.logger.error('❌ Error calling vehicle service:');
      this.logger.error('Message:', error.message);
      this.logger.error('Response:', error.response?.data);
      this.logger.error('Status:', error.response?.status);
      this.logger.error('Stack:', error.stack);
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.c.vehicle().get(`/customer/${id}`);
    } catch (error) {
      this.logger.error('Error in findOne:', error);
      throw error;
    }
  }

  @Post()
  async create(@Body() body: any) {
    try {
      return await this.c.vehicle().post('/customer', body);
    } catch (error) {
      this.logger.error('Error in create:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      return await this.c.vehicle().put(`/customer/${id}`, body);
    } catch (error) {
      this.logger.error('Error in update:', error);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.c.vehicle().delete(`/customer/${id}`);
    } catch (error) {
      this.logger.error('Error in remove:', error);
      throw error;
    }
  }
}
