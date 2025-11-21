import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ImageUpdateDto {
  @IsString()
  path: string;

  @IsOptional()
  @IsBoolean()
  is_main?: boolean;

  file: any;
}

class BenefitUpdateDto {
  @IsString()
  benefit: string;
}

class FeatureUpdateDto {
  @IsString()
  category: string;

  @IsString()
  item: string;
}

export class VehicleUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  // Relations
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageUpdateDto)
  images?: ImageUpdateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BenefitUpdateDto)
  benefits?: BenefitUpdateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureUpdateDto)
  features?: FeatureUpdateDto[];
}
