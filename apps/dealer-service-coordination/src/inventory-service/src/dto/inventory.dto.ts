import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty({ message: 'Vehicle model is required' })
  @IsString()
  vehicleModel!: string; // ← Thêm !

  @IsNotEmpty({ message: 'Vehicle color is required' })
  @IsString()
  vehicleColor!: string; // ← Thêm !

  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber()
  @Min(0, { message: 'Quantity must be at least 0' })
  quantity!: number; // ← Thêm !

  @IsOptional()
  @IsString()
  vehicleYear?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  vehicleYear?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class AdjustInventoryDto {
  @IsNotEmpty()
  @IsNumber()
  adjustmentQuantity!: number; // ← Thêm !

  @IsNotEmpty()
  @IsString()
  reason!: string; // ← Thêm !

  @IsOptional()
  @IsString()
  notes?: string;
}

export class InventoryResponseDto {
  id!: string; // ← Thêm !
  dealerId!: string; // ← Thêm !
  dealerName?: string;
  vehicleModel!: string; // ← Thêm !
  vehicleColor!: string; // ← Thêm !
  quantity!: number; // ← Thêm !
  vehicleYear?: string;
  vin?: string;
  description?: string;
  unitPrice?: number;
  totalValue?: number;
  createdAt!: Date; // ← Thêm !
  updatedAt!: Date; // ← Thêm !
}

export class InventorySummaryDto {
  totalVehicles!: number; // ← Thêm !
  totalModels!: number; // ← Thêm !
  totalValue!: number; // ← Thêm !
  inventoryByModel!: {
    // ← Thêm !
    model: string;
    totalQuantity: number;
    colors: {
      color: string;
      quantity: number;
    }[];
  }[];
}
