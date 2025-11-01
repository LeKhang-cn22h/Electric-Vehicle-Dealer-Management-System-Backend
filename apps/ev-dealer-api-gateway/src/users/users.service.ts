import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  constructor(@Inject('USERS_CLIENT') private client: ClientProxy) {}

  findAll() {
    return this.client.send('users.findAll', {});
  }
}
