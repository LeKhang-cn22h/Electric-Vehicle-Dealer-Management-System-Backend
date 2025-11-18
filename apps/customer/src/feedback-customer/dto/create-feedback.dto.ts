import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFeedbackDto {
  @IsNumber()
  @IsNotEmpty()
  customer_id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsNotEmpty()
  agency_id: number;

  @IsString()
  @IsNotEmpty()
  agency_name: string;
}
