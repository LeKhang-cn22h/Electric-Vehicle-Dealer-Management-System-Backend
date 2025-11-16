// src/dealer-agreement/dto/create-contract-request.dto.ts
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateContractRequestDto {
  @IsNotEmpty()
  @IsString()
  dealer_name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
