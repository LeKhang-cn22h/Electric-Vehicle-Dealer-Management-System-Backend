import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
