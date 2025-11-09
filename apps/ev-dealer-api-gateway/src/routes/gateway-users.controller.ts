import { Controller, Put, Get, Body, Headers } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('users')
export class GatewayUsersController {
  constructor(private readonly c: ServiceClients) {}

  @Put('profile')
  updateProfile(@Body() b: any, @Headers('authorization') auth: string) {
    return this.c.users().put('/users/profile', b, {
      authorization: auth,
      Authorization: auth,
    });
  }

  @Get('profile')
  getProfile(@Headers('authorization') auth: string) {
    return this.c.users().get('/users/profile', { Authorization: auth });
  }
}
