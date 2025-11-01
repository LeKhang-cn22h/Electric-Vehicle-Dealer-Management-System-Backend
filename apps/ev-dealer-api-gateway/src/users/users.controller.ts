import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { firstValueFrom } from 'rxjs';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return firstValueFrom(this.usersService.findAll());
  }
}
