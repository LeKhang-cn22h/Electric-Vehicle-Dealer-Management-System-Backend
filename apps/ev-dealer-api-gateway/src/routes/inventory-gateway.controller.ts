import { Controller, Get, Patch, Param, Query, Body, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import type { Request } from 'express';

@Controller('inventory')
export class InventoryGatewayController {
  private readonly baseUrl: string;

  constructor(private readonly http: HttpService) {
    this.baseUrl = process.env.INVENTORY_BASE_URL || 'http://localhost:4700/inventory';
  }

  // Admin: list stock toàn hệ thống
  @Get('admin/stock')
  adminStock(@Req() req: Request, @Query() query: any) {
    return this.http
      .get(`${this.baseUrl}/admin/stock`, {
        params: query,
        headers: {
          authorization: req.headers['authorization'] || '',
          cookie: req.headers['cookie'] || '',
        },
      })
      .pipe(map((res) => res.data));
  }

  // Dealer: list stock theo dealerId
  @Get('dealer/stock')
  dealerStock(@Req() req: Request, @Query() query: any) {
    return this.http
      .get(`${this.baseUrl}/dealer/stock`, {
        params: query, // có dealerId, vin, status, warehouseId...
        headers: {
          authorization: req.headers['authorization'] || '',
          cookie: req.headers['cookie'] || '',
        },
      })
      .pipe(map((res) => res.data));
  }

  // Đổi trạng thái xe
  @Patch('vehicle-units/:id/status')
  updateStatus(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.http
      .patch(`${this.baseUrl}/vehicle-units/${id}/status`, body, {
        headers: {
          authorization: req.headers['authorization'] || '',
          cookie: req.headers['cookie'] || '',
        },
      })
      .pipe(map((res) => res.data));
  }

  // Chuyển kho cho xe
  @Patch('vehicle-units/:id/move')
  moveVehicle(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.http
      .patch(`${this.baseUrl}/vehicle-units/${id}/move`, body, {
        headers: {
          authorization: req.headers['authorization'] || '',
          cookie: req.headers['cookie'] || '',
        },
      })
      .pipe(map((res) => res.data));
  }

  // List kho
  @Get('warehouses')
  listWarehouses(@Req() req: Request, @Query() query: any) {
    return this.http
      .get(`${this.baseUrl}/warehouses`, {
        params: query, // có thể có dealerId
        headers: {
          authorization: req.headers['authorization'] || '',
          cookie: req.headers['cookie'] || '',
        },
      })
      .pipe(map((res) => res.data));
  }
}
