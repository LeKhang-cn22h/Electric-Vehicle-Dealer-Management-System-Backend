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

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  price_note?: string;

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
  @IsString()
  color?: string;

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
