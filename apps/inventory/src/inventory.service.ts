import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class InventoryService {
  private sbAgreement = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'evm_agreement' },
    },
  );

  private sbProduct = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: 'product' },
    },
  );

  /** Admin: list stock toàn hệ thống, có filter */
  async listAdminStock(params: {
    dealerId?: string;
    warehouseId?: number;
    status?: string;
    vin?: string;
  }) {
    // v_vehicle_stock là VIEW:
    // SELECT vu.*, w.name as warehouse_name, w.dealer_id
    // FROM product.vehicle_unit vu
    // JOIN evm_agreement.warehouses w ON vu.warehouse_id = w.id;
    let query = this.sbAgreement.from('v_vehicle_stock').select('*');

    if (params.dealerId) {
      query = query.eq('dealer_id', params.dealerId);
    }
    if (params.warehouseId) {
      query = query.eq('warehouse_id', params.warehouseId);
    }
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.vin) {
      query = query.ilike('vin', `%${params.vin}%`);
    }

    const { data, error } = await query.order('id', { ascending: true });
    if (error) throw error;
    return data;
  }

  /** Dealer Manager: list stock theo dealer_id */
  async listDealerStock(dealerId: string) {
    const { data, error } = await this.sbAgreement
      .from('v_vehicle_stock')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('id', { ascending: true });

    if (error) throw error;
    return data;
  }

  /** Đổi status vehicle_unit (reserve, deployed, sold, ...) */
  async updateVehicleStatus(id: number, status: 'deployed' | 'available' | 'reserved' | 'sold') {
    const { data, error } = await this.sbProduct
      .from('vehicle_unit')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** Chuyển xe sang kho khác (trong / giữa đại lý) */
  async moveVehicleToWarehouse(id: number, newWarehouseId: number) {
    // check kho tồn tại
    const { data: warehouse, error: whError } = await this.sbAgreement
      .from('warehouses')
      .select('id')
      .eq('id', newWarehouseId)
      .maybeSingle();

    if (whError) throw whError;
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found');
    }

    const { data, error } = await this.sbProduct
      .from('vehicle_unit')
      .update({ warehouse_id: newWarehouseId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** List danh sách kho (cho dropdown chọn kho) */
  async listWarehouses(params?: { dealerId?: string }) {
    let query = this.sbAgreement.from('warehouses').select('*');

    if (params?.dealerId) {
      query = query.eq('dealer_id', params.dealerId);
    }

    const { data, error } = await query.order('id', { ascending: true });
    if (error) throw error;
    return data;
  }
}
