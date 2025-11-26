// apps/inventory/src/inventory.controller.ts
import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  /** Admin: list stock toàn hệ thống */
  @Get('admin/stock')
  getAdminStock(
    @Query('dealerId') dealerId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('vin') vin?: string,
  ) {
    return this.svc.listAdminStock({
      dealerId,
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      status,
      vin,
    });
  }

  /** Dealer: list stock theo dealer (tạm nhận dealerId qua query) */
  @Get('dealer/stock')
  getDealerStock(@Query('dealerId') dealerId: string) {
    return this.svc.listDealerStock(dealerId);
  }

  /** Đổi trạng thái xe */
  @Patch('vehicle-units/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'deployed' | 'available' | 'reserved' | 'sold',
  ) {
    return this.svc.updateVehicleStatus(Number(id), status);
  }

  /** Chuyển kho cho xe */
  @Patch('vehicle-units/:id/move')
  moveWarehouse(@Param('id') id: string, @Body('warehouseId') warehouseId: number) {
    return this.svc.moveVehicleToWarehouse(Number(id), Number(warehouseId));
  }

  /** List kho (admin / dealer) */
  @Get('warehouses')
  listWarehouses(@Query('dealerId') dealerId?: string) {
    return this.svc.listWarehouses({ dealerId });
  }
}
