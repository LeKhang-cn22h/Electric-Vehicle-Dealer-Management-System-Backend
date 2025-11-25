import {
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationItemDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsUUID()
  createdBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @IsOptional()
  @IsNumber()
  vatRate?: number; // mặc định 0.1 (10%)

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  promotionCode?: string[];
}
