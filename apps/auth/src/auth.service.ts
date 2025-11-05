import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function createAnon(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}
function createAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL!;
  const srole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return srole ? createClient(url, srole) : null;
}

@Injectable()
export class AuthService {
  private sb = createAnon();
  private admin = createAdmin();

  async health() {
    return { ok: true };
  }

  async signup(dto: { email: string; password: string; fullName?: string }) {
    const { data, error } = await this.sb.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: { data: { full_name: dto.fullName ?? '' } },
    });
    if (error) throw new BadRequestException(error.message);
    return { user: data.user, requires_confirm: !data.session };
  }

  async signupAdmin(dto: {
    email: string;
    password: string;
    fullName?: string;
  }) {
    if (!this.admin)
      throw new BadRequestException('No SERVICE_ROLE_KEY on server');
    const { data, error } = await this.admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { full_name: dto.fullName ?? '' },
    });
    if (error) throw new BadRequestException(error.message);
    return { user: data.user, requires_confirm: false };
  }

  async login(dto: { email: string; password: string }) {
    const { data, error } = await this.sb.auth.signInWithPassword(dto);
    if (error) throw new BadRequestException(error.message);
    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: data.session?.user,
    };
  }

  async me(token: string) {
    const { data, error } = await this.sb.auth.getUser(token);
    if (error) throw new BadRequestException(error.message);
    return data.user;
  }

  async refresh(refresh_token: string) {
    const { data, error } = await this.sb.auth.refreshSession({
      refresh_token,
    });
    if (error) throw new BadRequestException(error.message);
    return data.session;
  }

  async resend(email: string) {
    const { data, error } = await this.sb.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw new BadRequestException(error.message);
    return { sent: true, data };
  }
}
