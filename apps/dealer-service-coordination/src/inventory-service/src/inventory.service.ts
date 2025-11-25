import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustInventoryDto,
  InventoryResponseDto,
  InventorySummaryDto,
} from './dto/Inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Tạo mới inventory item
   */
  async createInventory(
    userId: string,
    createInventoryDto: CreateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const supabase = this.supabaseService.getClient();

    // Lấy thông tin dealer từ userId
    const dealer = await this.getDealerByUserId(userId);

    // Kiểm tra xem vehicle này đã tồn tại trong kho chưa
    const { data: existingInventory } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .select('id, vehicle_model, vehicle_color')
      .eq('dealer_id', dealer.id)
      .eq('vehicle_model', createInventoryDto.vehicleModel)
      .eq('vehicle_color', createInventoryDto.vehicleColor)
      .maybeSingle();

    if (existingInventory) {
      throw new ConflictException(
        `Vehicle "${createInventoryDto.vehicleModel}" with color "${createInventoryDto.vehicleColor}" already exists in your inventory. Please update instead.`,
      );
    }

    // Tạo inventory mới
    const { data, error } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .insert({
        dealer_id: dealer.id,
        vehicle_model: createInventoryDto.vehicleModel,
        vehicle_color: createInventoryDto.vehicleColor,
        quantity: createInventoryDto.quantity,
        vehicle_year: createInventoryDto.vehicleYear,
        vin: createInventoryDto.vin,
        description: createInventoryDto.description,
        unit_price: createInventoryDto.unitPrice,
      })
      .select(
        `
        *,
        dealers:dealer_id (
          name
        )
      `,
      )
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create inventory: ${error.message}`);
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Lấy danh sách tồn kho của dealer
   */
  async getMyInventory(
    userId: string,
    options?: {
      vehicleModel?: string;
      vehicleColor?: string;
      minQuantity?: number;
    },
  ): Promise<InventoryResponseDto[]> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    let query = supabase
      .schema('distribution')
      .from('dealer_inventory')
      .select(
        `
        *,
        dealers:dealer_id (
          name
        )
      `,
      )
      .eq('dealer_id', dealer.id);

    // Apply filters
    if (options?.vehicleModel) {
      query = query.ilike('vehicle_model', `%${options.vehicleModel}%`);
    }
    if (options?.vehicleColor) {
      query = query.ilike('vehicle_color', `%${options.vehicleColor}%`);
    }
    if (options?.minQuantity !== undefined) {
      query = query.gte('quantity', options.minQuantity);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch inventory: ${error.message}`);
    }

    return data.map((item) => this.mapToResponseDto(item));
  }

  /**
   * Lấy chi tiết một inventory item
   */
  async getInventoryById(userId: string, inventoryId: string): Promise<InventoryResponseDto> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    const { data, error } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .select(
        `
        *,
        dealers:dealer_id (
          name
        )
      `,
      )
      .eq('id', inventoryId)
      .eq('dealer_id', dealer.id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Cập nhật inventory item
   */
  async updateInventory(
    userId: string,
    inventoryId: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    // Kiểm tra inventory có tồn tại và thuộc về dealer này không
    await this.getInventoryById(userId, inventoryId);

    // Nếu update model hoặc color, kiểm tra không trùng với inventory khác
    if (updateInventoryDto.vehicleModel || updateInventoryDto.vehicleColor) {
      const { data: existing } = await supabase
        .schema('distribution')
        .from('dealer_inventory')
        .select('id')
        .eq('dealer_id', dealer.id)
        .eq('vehicle_model', updateInventoryDto.vehicleModel || '')
        .eq('vehicle_color', updateInventoryDto.vehicleColor || '')
        .neq('id', inventoryId)
        .maybeSingle();

      if (existing) {
        throw new ConflictException('This vehicle model and color combination already exists');
      }
    }

    const { data, error } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .update({
        ...updateInventoryDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryId)
      .eq('dealer_id', dealer.id)
      .select(
        `
        *,
        dealers:dealer_id (
          name
        )
      `,
      )
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update inventory: ${error.message}`);
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Điều chỉnh số lượng tồn kho (tăng/giảm)
   */
  async adjustInventoryQuantity(
    userId: string,
    inventoryId: string,
    adjustDto: AdjustInventoryDto,
  ): Promise<InventoryResponseDto> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    // Lấy inventory hiện tại
    const currentInventory = await this.getInventoryById(userId, inventoryId);

    const newQuantity = currentInventory.quantity + adjustDto.adjustmentQuantity;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Cannot adjust inventory. New quantity would be ${newQuantity}. Current quantity: ${currentInventory.quantity}`,
      );
    }

    // Update quantity
    const { data, error } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryId)
      .eq('dealer_id', dealer.id)
      .select(
        `
        *,
        dealers:dealer_id (
          name
        )
      `,
      )
      .single();

    if (error) {
      throw new BadRequestException(`Failed to adjust inventory: ${error.message}`);
    }

    // Tạo log điều chỉnh (optional - nếu bạn có bảng inventory_logs)
    await this.createInventoryLog(dealer.id, inventoryId, adjustDto);

    return this.mapToResponseDto(data);
  }

  /**
   * Xóa inventory item
   */
  async deleteInventory(userId: string, inventoryId: string): Promise<{ message: string }> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    // Kiểm tra inventory có tồn tại không
    await this.getInventoryById(userId, inventoryId);

    const { error } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .delete()
      .eq('id', inventoryId)
      .eq('dealer_id', dealer.id);

    if (error) {
      throw new BadRequestException(`Failed to delete inventory: ${error.message}`);
    }

    return { message: 'Inventory item deleted successfully' };
  }

  /**
   * Lấy tổng quan tồn kho (summary/statistics)
   */
  async getInventorySummary(userId: string): Promise<InventorySummaryDto> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    const { data, error } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .select('*')
      .eq('dealer_id', dealer.id);

    if (error) {
      throw new BadRequestException(`Failed to fetch inventory summary: ${error.message}`);
    }

    // Tính toán thống kê
    const totalVehicles = data.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = data.reduce((sum, item) => {
      const price = item.unit_price || 0;
      return sum + price * item.quantity;
    }, 0);

    // Group by model
    const modelMap = new Map<string, { totalQuantity: number; colors: Map<string, number> }>();

    data.forEach((item) => {
      if (!modelMap.has(item.vehicle_model)) {
        modelMap.set(item.vehicle_model, {
          totalQuantity: 0,
          colors: new Map(),
        });
      }

      const modelData = modelMap.get(item.vehicle_model)!;
      modelData.totalQuantity += item.quantity;

      const currentColorQty = modelData.colors.get(item.vehicle_color) || 0;
      modelData.colors.set(item.vehicle_color, currentColorQty + item.quantity);
    });

    const inventoryByModel = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      totalQuantity: data.totalQuantity,
      colors: Array.from(data.colors.entries()).map(([color, quantity]) => ({
        color,
        quantity,
      })),
    }));

    return {
      totalVehicles,
      totalModels: modelMap.size,
      totalValue,
      inventoryByModel,
    };
  }

  /**
   * Kiểm tra số lượng tồn kho cho một vehicle
   */
  async checkInventoryAvailability(
    userId: string,
    vehicleModel: string,
    vehicleColor: string,
  ): Promise<{ available: boolean; quantity: number }> {
    const supabase = this.supabaseService.getClient();
    const dealer = await this.getDealerByUserId(userId);

    const { data } = await supabase
      .schema('distribution')
      .from('dealer_inventory')
      .select('quantity')
      .eq('dealer_id', dealer.id)
      .eq('vehicle_model', vehicleModel)
      .eq('vehicle_color', vehicleColor)
      .maybeSingle();

    if (!data) {
      return { available: false, quantity: 0 };
    }

    return {
      available: data.quantity > 0,
      quantity: data.quantity,
    };
  }

  // ============ Private Helper Methods ============

  private async getDealerByUserId(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: dealer, error } = await supabase
      .schema('distribution')
      .from('dealers')
      .select('id, name, code')
      .eq('user_id', userId)
      .single();

    if (error || !dealer) {
      throw new NotFoundException('Dealer not found for this user');
    }

    return dealer;
  }

  private mapToResponseDto(data: any): InventoryResponseDto {
    const totalValue = data.unit_price ? data.unit_price * data.quantity : undefined;

    return {
      id: data.id,
      dealerId: data.dealer_id,
      dealerName: data.dealers?.name,
      vehicleModel: data.vehicle_model,
      vehicleColor: data.vehicle_color,
      quantity: data.quantity,
      vehicleYear: data.vehicle_year,
      vin: data.vin,
      description: data.description,
      unitPrice: data.unit_price,
      totalValue,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private async createInventoryLog(
    dealerId: string,
    inventoryId: string,
    adjustDto: AdjustInventoryDto,
  ) {
    const supabase = this.supabaseService.getClient();

    // Optional: Tạo log nếu bạn có bảng inventory_logs
    await supabase.schema('distribution').from('inventory_logs').insert({
      dealer_id: dealerId,
      inventory_id: inventoryId,
      adjustment_quantity: adjustDto.adjustmentQuantity,
      reason: adjustDto.reason,
      notes: adjustDto.notes,
    });
  }
}
