import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedbackDto } from './create-feedback.dto';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateFeedbackDto extends PartialType(CreateFeedbackDto) {
  @IsNumber()
  @IsOptional()
  admin_id?: number;

  @IsString()
  @IsOptional()
  admin_reply?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
