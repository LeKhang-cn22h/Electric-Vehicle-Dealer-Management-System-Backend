import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServiceClients } from '../service-clients';

@Controller('rbac')
export class GatewayRbacController {
  constructor(private readonly clients: ServiceClients) {}

  @Post('roles')
  createRole(@Body() b: { code: string; name: string }) {
    return this.clients.rbac().post('/rbac/roles', b);
  }

  @Get('roles')
  listRoles() {
    return this.clients.rbac().get('/rbac/roles');
  }

  @Post('permissions')
  createPermission(@Body() b: { code: string; name: string }) {
    return this.clients.rbac().post('/rbac/permissions', b);
  }

  @Get('permissions')
  listPermissions() {
    return this.clients.rbac().get('/rbac/permissions');
  }

  @Post('roles/:role_id/permissions/:perm_id')
  addPermission(@Param('role_id') role_id: string, @Param('perm_id') perm_id: string) {
    return this.clients.rbac().post(`/rbac/roles/${role_id}/permissions/${perm_id}`, {});
  }

  @Get('roles/:role_id/permissions')
  getRolePermissions(@Param('role_id') role_id: string) {
    return this.clients.rbac().get(`/rbac/roles/${role_id}/permissions`);
  }

  @Post('assign-role')
  assignRole(@Body() b: { user_id: string; role_id: string; dealer_id?: string }) {
    return this.clients.rbac().post('/rbac/assign-role', b);
  }

  @Get('user/:user_id/roles')
  getUserRoles(@Param('user_id') user_id: string) {
    return this.clients.rbac().get(`/rbac/user/${user_id}/roles`);
  }
}
