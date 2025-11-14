import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), 'apps/rbac/.env');
dotenv.config({ path: envPath });

@Injectable()
export class RbacService {
  private db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: 'platform' },
  });
  // ROLES
  async createRole(code: string, name: string) {
    const { error } = await this.db.from('rbac_roles').insert({ code, name });

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException(`Role '${code}' already exists`);
      }
      throw new BadRequestException(error.message);
    }

    return { message: 'Role created', code };
  }

  async listRoles() {
    return this.db.from('rbac_roles').select('*').order('code');
  }

  // PERMISSIONS
  async createPermission(code: string, name: string) {
    const { error } = await this.db.from('rbac_permissions').insert({ code, name });

    if (error) throw error;
    return { message: 'Permission created', code };
  }

  async listPermissions() {
    return this.db.from('rbac_permissions').select('*').order('code');
  }

  //  ROLE ↔ PERMISSION
  async assignPermissionToRole(role_id: string, perm_id: string) {
    const { error } = await this.db.from('rbac_role_permissions').insert({ role_id, perm_id });

    if (error) throw error;
    return { message: 'Permission assigned' };
  }

  async getRolePermissions(role_id: string) {
    return this.db
      .from('rbac_role_permissions')
      .select(
        `
        perm_id,
        rbac_permissions (*)
      `,
      )
      .eq('role_id', role_id);
  }

  // USER ↔ ROLE
  async assignRoleToUser(user_id: string, role_id: string, dealer_id?: string) {
    const { error } = await this.db
      .from('rbac_user_roles')
      .insert({ user_id, role_id, dealer_id: dealer_id ?? null });

    if (error) throw error;
    return { message: 'Role assigned to user' };
  }

  async getUserRoles(user_id: string) {
    return this.db
      .from('rbac_user_roles')
      .select(
        `
        role_id,
        dealer_id,
        rbac_roles (*)
      `,
      )
      .eq('user_id', user_id);
  }
}
