import { IsString, IsOptional } from 'class-validator';

export class CreateZpDto {
  @IsString() inv_id!: string;
  @IsOptional() @IsString() app_user?: string;
}
