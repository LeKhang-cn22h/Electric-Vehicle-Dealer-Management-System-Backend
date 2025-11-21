import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ImageDto {
  @IsString()
  path: string;

  @IsOptional()
  @IsBoolean()
  is_main?: boolean;

  file: any;
}

class BenefitDto {
  @IsString()
  benefit: string;
}

class FeatureDto {
  @IsString()
  category: string;

  @IsString()
  item: string;
}

export class VehicleCreateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  mileage?: string;

  @IsOptional()
  @IsString()
  fuel_type?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  color?: string[];

  @IsOptional()
  @IsString()
  engine?: string;

  @IsOptional()
  @IsNumber()
  seats?: number;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsNumber()
  quantity: number = 0;
  // ---- Relations ----
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitDto)
  benefits?: BenefitDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features?: FeatureDto[];
}
export class CreateVehicleUnitDTO {
  @IsNumber()
  vehicle_id: number;

  @IsString()
  vin: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  status?: string;
}
