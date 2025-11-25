import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { SupabaseService } from '../../../supabase/supabase.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustInventoryDto,
  InventoryResponseDto,
  InventorySummaryDto,
} from './dto/inventory.dto';
import type { Request } from 'express';

@Controller('inventory')
export class InventoryController {
  // constructor(
  //   private readonly inventoryService: InventoryService,
  //   private readonly supabaseService: SupabaseService,
  // ) {}
  // /**
  //  * POST /inventory - Tạo mới inventory item
  //  */
  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // async createInventory(
  //   @Body() CreateInventoryDto: CreateInventoryDto,
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<InventoryResponseDto> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.createInventory(user.id, token, CreateInventoryDto);
  // }
  // /**
  //  * GET /inventory - Lấy danh sách tồn kho
  //  * Query params: vehicleModel, vehicleColor, minQuantity
  //  */
  // @Get()
  // async getMyInventory(
  //   @Query('vehicleModel') vehicleModel?: string,
  //   @Query('vehicleColor') vehicleColor?: string,
  //   @Query('minQuantity') minQuantity?: string,
  //   @Req() req?: Request,
  //   @Headers('authorization') auth?: string,
  // ): Promise<InventoryResponseDto[]> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.getMyInventory(user.id, token, {
  //     vehicleModel,
  //     vehicleColor,
  //     minQuantity: minQuantity ? parseInt(minQuantity) : undefined,
  //   });
  // }
  // /**
  //  * GET /inventory/summary - Lấy tổng quan tồn kho
  //  */
  // @Get('summary')
  // async getInventorySummary(
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<InventorySummaryDto> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.getInventorySummary(user.id, token);
  // }
  // /**
  //  * GET /inventory/check-availability - Kiểm tra tồn kho
  //  */
  // @Get('check-availability')
  // async checkAvailability(
  //   @Query('vehicleModel') vehicleModel: string,
  //   @Query('vehicleColor') vehicleColor: string,
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<{ available: boolean; quantity: number }> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   if (!vehicleModel || !vehicleColor) {
  //     throw new BadRequestException('vehicleModel and vehicleColor are required');
  //   }
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.checkInventoryAvailability(
  //     user.id,
  //     token,
  //     vehicleModel,
  //     vehicleColor,
  //   );
  // }
  // /**
  //  * GET /inventory/:id - Lấy chi tiết inventory item
  //  */
  // @Get(':id')
  // async getInventoryById(
  //   @Param('id') id: string,
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<InventoryResponseDto> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.getInventoryById(user.id, token, id);
  // }
  // /**
  //  * PUT /inventory/:id - Cập nhật inventory item
  //  */
  // @Put(':id')
  // async updateInventory(
  //   @Param('id') id: string,
  //   @Body() updateInventoryDto: UpdateInventoryDto,
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<InventoryResponseDto> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.updateInventory(user.id, token, id, updateInventoryDto);
  // }
  // /**
  //  * PATCH /inventory/:id/adjust - Điều chỉnh số lượng tồn kho
  //  */
  // @Patch(':id/adjust')
  // async adjustQuantity(
  //   @Param('id') id: string,
  //   @Body() adjustDto: AdjustInventoryDto,
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<InventoryResponseDto> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.adjustInventoryQuantity(user.id, token, id, adjustDto);
  // }
  // /**
  //  * DELETE /inventory/:id - Xóa inventory item
  //  */
  // @Delete(':id')
  // @HttpCode(HttpStatus.OK)
  // async deleteInventory(
  //   @Param('id') id: string,
  //   @Req() req: Request,
  //   @Headers('authorization') auth: string,
  // ): Promise<{ message: string }> {
  //   if (!auth) throw new BadRequestException('Missing Authorization header');
  //   const user = await this.supabaseService.getUserFromRequest(req);
  //   if (!user) throw new Error('Unauthorized: Token missing or invalid');
  //   const token = auth.replace('Bearer ', '');
  //   return this.inventoryService.deleteInventory(user.id, token, id);
  // }
}
