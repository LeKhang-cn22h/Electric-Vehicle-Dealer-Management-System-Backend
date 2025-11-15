import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RbacService } from './rbac.service';

@Controller('rbac')
export class RbacController {
  constructor(private readonly svc: RbacService) {}

  @Post('roles')
  createRole(@Body() b: { code: string; name: string }) {
    return this.svc.createRole(b.code, b.name);
  }

  @Get('roles')
  listRoles() {
    return this.svc.listRoles();
  }

  @Post('permissions')
  createPermission(@Body() b: { code: string; name: string }) {
    return this.svc.createPermission(b.code, b.name);
  }

  @Get('permissions')
  listPermissions() {
    return this.svc.listPermissions();
  }

  @Post('roles/:role_id/permissions/:perm_id')
  addPermission(@Param('role_id') role_id: string, @Param('perm_id') perm_id: string) {
    return this.svc.assignPermissionToRole(role_id, perm_id);
  }

  @Get('roles/:role_id/permissions')
  getRolePermissions(@Param('role_id') role_id: string) {
    return this.svc.getRolePermissions(role_id);
  }

  @Post('assign-role')
  assignRole(@Body() b: { user_id: string; role_id: string; dealer_id?: string }) {
    return this.svc.assignRoleToUser(b.user_id, b.role_id, b.dealer_id);
  }

  @Get('user/:user_id/roles')
  getUserRoles(@Param('user_id') user_id: string) {
    return this.svc.getUserRoles(user_id);
  }
}
