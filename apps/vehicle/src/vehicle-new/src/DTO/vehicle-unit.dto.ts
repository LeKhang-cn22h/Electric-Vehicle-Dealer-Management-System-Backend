import { IsNotEmpty, IsString, IsInt, IsOptional, IsArray, IsEnum, Min } from 'class-validator';

// ============================================
// ENUMS
// ============================================

export enum VehicleUnitStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  DEPLOYED = 'deployed',
  SOLD = 'sold',
  PAID = 'paid',
  MAINTENANCE = 'maintenance',
}

// ============================================
// CREATE VEHICLE UNIT DTO
// ============================================

export class CreateVehicleUnitDto {
  @IsInt({ message: 'vehicle_id phải là số nguyên' })
  @IsNotEmpty({ message: 'vehicle_id không được để trống' })
  vehicle_id: number;

  @IsString({ message: 'VIN phải là chuỗi' })
  @IsNotEmpty({ message: 'VIN không được để trống' })
  vin: string;

  @IsString({ message: 'color phải là chuỗi' })
  @IsNotEmpty({ message: 'color không được để trống' })
  color: string;

  @IsOptional()
  @IsEnum(VehicleUnitStatus, { message: 'status không hợp lệ' })
  status?: string;
}

// ============================================
// UPDATE VEHICLE UNIT DTO
// ============================================

export class UpdateVehicleUnitDto {
  @IsOptional()
  @IsString({ message: 'VIN phải là chuỗi' })
  vin?: string;

  @IsOptional()
  @IsString({ message: 'color phải là chuỗi' })
  color?: string;

  @IsOptional()
  @IsEnum(VehicleUnitStatus, { message: 'status không hợp lệ' })
  status?: string;

  @IsOptional()
  @IsInt({ message: 'warehouse_id phải là số nguyên' })
  warehouse_id?: number | null;
}

// ============================================
// DEPLOY TO WAREHOUSE DTO
// ============================================

export class DeployToWarehouseDto {
  @IsArray({ message: 'vehicle_unit_ids phải là mảng' })
  @IsInt({ each: true, message: 'Mỗi vehicle_unit_id phải là số nguyên' })
  @IsNotEmpty({ message: 'vehicle_unit_ids không được để trống' })
  vehicle_unit_ids: number[];

  @IsInt({ message: 'warehouse_id phải là số nguyên' })
  @IsNotEmpty({ message: 'warehouse_id không được để trống' })
  warehouse_id: number;
}

// ============================================
// DEPLOY MULTIPLE UNITS DTO
// ============================================

export class DeployMultipleUnitsDto {
  @IsInt({ message: 'vehicle_id phải là số nguyên' })
  @IsNotEmpty({ message: 'vehicle_id không được để trống' })
  vehicle_id: number;

  @IsInt({ message: 'warehouse_id phải là số nguyên' })
  @IsNotEmpty({ message: 'warehouse_id không được để trống' })
  warehouse_id: number;

  @IsInt({ message: 'quantity phải là số nguyên' })
  @Min(1, { message: 'quantity phải lớn hơn 0' })
  @IsNotEmpty({ message: 'quantity không được để trống' })
  quantity: number;
}

// ============================================
// FILTER VEHICLE UNITS DTO
// ============================================

export class FilterVehicleUnitsDto {
  @IsOptional()
  @IsInt({ message: 'vehicle_id phải là số nguyên' })
  vehicle_id?: number;

  @IsOptional()
  @IsEnum(VehicleUnitStatus, { message: 'status không hợp lệ' })
  status?: string;

  @IsOptional()
  @IsInt({ message: 'warehouse_id phải là số nguyên' })
  warehouse_id?: number;
}

// ============================================
// RESERVE VEHICLE DTO
// ============================================

export class ReserveVehicleDto {
  @IsInt({ message: 'unit_id phải là số nguyên' })
  @IsNotEmpty({ message: 'unit_id không được để trống' })
  unit_id: number;

  @IsOptional()
  @IsString({ message: 'customer_id phải là chuỗi' })
  customer_id?: string;

  @IsOptional()
  @IsString({ message: 'note phải là chuỗi' })
  note?: string;
}

// ============================================
// PAY VEHICLE DTO
// ============================================

export class PayVehicleDto {
  @IsString({ message: 'vin phải là chuỗi' })
  @IsNotEmpty({ message: 'vin không được để trống' })
  vin: string;

  @IsOptional()
  @IsString({ message: 'customer_id phải là chuỗi' })
  customer_id?: string;

  @IsOptional()
  @IsString({ message: 'payment_method phải là chuỗi' })
  payment_method?: string;
}
