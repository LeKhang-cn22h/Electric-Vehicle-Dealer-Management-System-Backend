import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { UpdateProfileDto } from './dtos/UpdateProfile.dto';
import { CreateDealerDto } from './dtos/CreateDealerDto';

const envPath = path.resolve(process.cwd(), 'apps/users/.env');
dotenv.config({ path: envPath });
function createAdmin(): SupabaseClient<any> {
  const url = process.env.SUPABASE_URL!;
  const srole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!srole) throw new Error('SERVICE_ROLE_KEY missing');

  return createClient(url, srole, {
    db: { schema: 'platform' },
  }) as any;
}

function createAnon() {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    db: { schema: 'platform' },
  });
}

@Injectable()
export class UsersService {
  private admin = createAdmin();
  private sb = createAnon();

  async getRoleId(code: string) {
    const { data, error } = await this.admin
      .from('rbac_roles')
      .select('id')
      .eq('code', code)
      .single();

    if (error) {
      throw new BadRequestException(`Không tìm thấy role: ${code}`);
    }

    return data.id;
  }

  async updateProfile(token: string, dto: UpdateProfileDto, avatar?: Express.Multer.File) {
    console.log('[UsersService] updateProfile called:', {
      hasAvatar: !!avatar,
      avatarSize: avatar?.size,
      avatarMimetype: avatar?.mimetype,
      dto,
    });

    // Verify token và lấy user info
    const { data: userData, error: userError } = await this.sb.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('[UsersService] Token verification failed:', userError);
      throw new UnauthorizedException('Invalid token');
    }

    const userId = userData.user.id;
    let avatar_url = userData.user.user_metadata.avatar_url || '';

    console.log('[UsersService] User verified:', {
      userId,
      currentAvatar: avatar_url,
    });

    if (!this.admin) {
      throw new BadRequestException('Admin Supabase client not configured');
    }
    if (avatar) {
      console.log('[UsersService] Processing avatar upload...');

      try {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(avatar.mimetype)) {
          throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        }
        const maxSize = 5 * 1024 * 1024;
        if (avatar.size > maxSize) {
          throw new BadRequestException('File size too large. Maximum size is 5MB.');
        }
        const fileExt = avatar.mimetype.split('/')[1];
        const timestamp = Date.now();
        const fileName = `${userId}_${timestamp}.${fileExt}`;
        if (avatar_url && avatar_url.includes('/avatars/')) {
          const urlParts = avatar_url.split('/avatars/');
          if (urlParts[1]) {
            const oldFileName = urlParts[1].split('?')[0];
            console.log('[UsersService] Removing old avatar:', oldFileName);
            try {
              await this.admin.storage.from('avatars').remove([oldFileName]);
            } catch (err) {
              console.warn('[UsersService] Failed to remove old avatar:', err.message);
            }
          }
        }
        const { data: uploadData, error: uploadErr } = await this.admin.storage
          .from('avatars')
          .upload(fileName, avatar.buffer, {
            contentType: avatar.mimetype,
            upsert: true,
            cacheControl: '3600',
          });

        if (uploadErr) {
          console.error('[UsersService] Upload error:', uploadErr);
          throw new BadRequestException('Upload avatar failed: ' + uploadErr.message);
        }

        console.log('[UsersService] Upload successful:', uploadData);
        const { data: urlData } = this.admin.storage.from('avatars').getPublicUrl(fileName);

        avatar_url = urlData.publicUrl;
        console.log('[UsersService] New avatar URL:', avatar_url);
      } catch (error) {
        console.error('[UsersService] Avatar upload failed:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to upload avatar: ' + error.message);
      }
    }
    const { error: updateError } = await this.admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        full_name: dto.full_name || userData.user.user_metadata.full_name,
        phone: dto.phone || userData.user.user_metadata.phone,
        avatar_url,
      },
    });

    if (updateError) {
      throw new BadRequestException('Update profile failed: ' + updateError.message);
    }

    return {
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: {
        full_name: dto.full_name || userData.user.user_metadata.full_name,
        phone: dto.phone || userData.user.user_metadata.phone,
        avatar_url,
      },
    };
  }

  async getProfile(token: string) {
    const { data, error } = await this.sb.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata.full_name,
      phone: data.user.user_metadata.phone,
      avatar_url: data.user.user_metadata.avatar_url,
      created_at: data.user.created_at,
    };
  }

  // DEALERS MANAGEMENT
  async listDealers() {
    const { data, error } = await this.admin
      .from('dealers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createDealer(dto: CreateDealerDto) {
    console.log('[UsersService] Creating dealer with data:', dto);

    if (!dto.name) throw new BadRequestException('Tên đại lý là bắt buộc');
    if (!dto.user_email || !dto.user_password) {
      throw new BadRequestException('Email & mật khẩu tài khoản đại lý là bắt buộc');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.user_email)) {
      throw new BadRequestException('Email không hợp lệ');
    }
    if (dto.user_password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    try {
      //  Kiểm tra email đã tồn tại trong Supabase Auth
      console.log('[UsersService] Checking if email exists...');
      const { data: existingUsers } = await this.admin.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some((u: any) => u.email === dto.user_email);

      if (emailExists) {
        throw new BadRequestException(`Email ${dto.user_email} đã được sử dụng`);
      }

      // Tạo dealer trong schema `users`
      const { data: dealerData, error: dealerErr } = await this.admin
        .from('dealers')
        .insert({
          name: dto.name,
          phone: dto.phone ?? '',
          address: dto.address ?? '',
          status: dto.status ?? 'active',
        })
        .select()
        .single();

      if (dealerErr) {
        console.error('[UsersService] Dealer creation error:', dealerErr);
        throw new BadRequestException('Tạo đại lý thất bại: ' + dealerErr.message);
      }

      const dealer_id = dealerData.id;
      console.log('[UsersService] Dealer created with ID:', dealer_id);

      // Tạo Supabase user kèm metadata
      console.log('[UsersService] Creating user account...');
      const { data: createdUser, error: createUserErr } = await this.admin.auth.admin.createUser({
        email: dto.user_email,
        password: dto.user_password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.user_full_name ?? dto.name,
          phone: dto.user_phone ?? dto.phone ?? '',
          role: 'dealer_manager',
          dealer_id: dealer_id,
        },
      });

      if (createUserErr) {
        console.error('[UsersService] User creation error:', createUserErr);
        await this.admin.from('dealers').delete().eq('id', dealer_id);

        if (
          createUserErr.message.includes('already registered') ||
          createUserErr.message.includes('already exists')
        ) {
          throw new BadRequestException(`Email ${dto.user_email} đã được sử dụng`);
        }
        throw new BadRequestException('Tạo tài khoản đại lý thất bại: ' + createUserErr.message);
      }

      const user_id = createdUser.user?.id;

      if (!user_id) {
        await this.admin.from('dealers').delete().eq('id', dealer_id);
        throw new BadRequestException('Không nhận được user_id từ Supabase');
      }

      console.log('[UsersService] User created with ID:', user_id);

      return {
        message: 'Tạo đại lý và tài khoản thành công',
        dealer: dealerData,
        user: {
          id: user_id,
          email: dto.user_email,
          role: 'dealer_manager',
          dealer_id,
        },
      };
    } catch (error) {
      console.error('[UsersService] Dealer creation failed:', error);
      throw new BadRequestException(error.message);
    }
  }

  async updateDealer(id: string, dto: any) {
    const { error } = await this.admin
      .from('dealers')
      .update({
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        status: dto.status,
      })
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'Cập nhật đại lý thành công' };
  }

  async deleteDealer(id: string) {
    try {
      const { error: dealerError } = await this.admin.from('dealers').delete().eq('id', id);
      if (dealerError) throw new BadRequestException(dealerError.message);
      return { message: 'Xóa đại lý thành công' };
    } catch (error) {
      console.error('[UsersService] Delete dealer error:', error);
      throw new BadRequestException('Xóa đại lý thất bại: ' + error.message);
    }
  }

  private async getDealerIdFromToken(token: string): Promise<string> {
    const { data: userData, error } = await this.sb.auth.getUser(token);
    if (error || !userData.user) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const meta: any = userData.user.user_metadata || {};
    const dealer_id = meta.dealer_id;
    const role = meta.role;

    if (!dealer_id || role !== 'dealer_manager') {
      throw new BadRequestException(
        'Tài khoản hiện tại không phải Dealer Manager hoặc không có dealer_id',
      );
    }

    return dealer_id;
  }

  async listDealerStaff(token: string) {
    const dealer_id = await this.getDealerIdFromToken(token);
    const { data: usersData, error } = await this.admin.auth.admin.listUsers();
    if (error) {
      throw new BadRequestException('Không lấy được danh sách user: ' + error.message);
    }

    const staffs = (usersData.users || []).filter((u: any) => {
      const meta = (u.user_metadata || {}) as any;
      return meta.role === 'dealer_staff' && meta.dealer_id === dealer_id;
    });

    return staffs.map((u: any) => {
      const meta = (u.user_metadata || {}) as any;
      return {
        id: u.id,
        email: u.email,
        full_name: meta.full_name || (u.email ? u.email.split('@')[0] : ''),
        phone: meta.phone || '',
        status: 'active' as const,
      };
    });
  }

  async createDealerStaff(
    token: string,
    dto: { full_name: string; email: string; phone?: string; password: string },
  ) {
    if (!dto.full_name || !dto.email || !dto.password) {
      throw new BadRequestException('Họ tên, Email và Mật khẩu là bắt buộc');
    }
    if (dto.password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const dealer_id = await this.getDealerIdFromToken(token);

    try {
      const { data: createdUser, error: createUserErr } = await this.admin.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.full_name,
          phone: dto.phone ?? '',
          role: 'dealer_staff',
          dealer_id,
        },
      });

      if (createUserErr) {
        if (
          createUserErr.message.includes('already registered') ||
          createUserErr.message.includes('already exists')
        ) {
          throw new BadRequestException(`Email ${dto.email} đã được sử dụng`);
        }
        throw new BadRequestException('Tạo tài khoản nhân viên thất bại: ' + createUserErr.message);
      }

      const user_id = createdUser.user?.id;
      if (!user_id) {
        throw new BadRequestException('Không nhận được user_id từ Supabase');
      }

      return {
        id: user_id,
        email: dto.email,
        full_name: dto.full_name,
        phone: dto.phone ?? '',
        status: 'active' as const,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error?.message || 'Tạo nhân viên thất bại');
    }
  }

  async updateDealerStaff(
    token: string,
    staffId: string,
    dto: { full_name?: string; phone?: string },
  ) {
    const dealer_id = await this.getDealerIdFromToken(token);

    const { data, error: staffErr } = await this.admin.auth.admin.getUserById(staffId);
    if (staffErr || !data?.user) {
      throw new BadRequestException('Không tìm thấy nhân viên cần cập nhật');
    }

    const staff = data.user;
    const meta = (staff.user_metadata || {}) as any;

    if (meta.dealer_id !== dealer_id || meta.role !== 'dealer_staff') {
      throw new BadRequestException('Nhân viên này không thuộc đại lý của bạn');
    }

    const newMeta = {
      ...meta,
      full_name: dto.full_name ?? meta.full_name,
      phone: dto.phone ?? meta.phone,
    };

    const { error: updateErr } = await this.admin.auth.admin.updateUserById(staffId, {
      user_metadata: newMeta,
    });

    if (updateErr) {
      throw new BadRequestException('Cập nhật nhân viên thất bại: ' + updateErr.message);
    }

    return {
      id: staffId,
      email: staff.email ?? '',
      full_name: newMeta.full_name || (staff.email ? staff.email.split('@')[0] : ''),
      phone: newMeta.phone || '',
      status: 'active' as const,
    };
  }

  async deleteDealerStaff(token: string, staffId: string) {
    const dealer_id = await this.getDealerIdFromToken(token);

    const { data, error: staffErr } = await this.admin.auth.admin.getUserById(staffId);
    if (staffErr || !data?.user) {
      throw new BadRequestException('Không tìm thấy nhân viên cần xoá');
    }

    const staff = data.user;
    const meta = (staff.user_metadata || {}) as any;

    if (meta.dealer_id !== dealer_id || meta.role !== 'dealer_staff') {
      throw new BadRequestException('Nhân viên này không thuộc đại lý của bạn');
    }

    const { error: delErr } = await this.admin.auth.admin.deleteUser(staffId);
    if (delErr) {
      throw new BadRequestException('Xoá tài khoản staff thất bại: ' + delErr.message);
    }

    return { message: 'Xoá nhân viên thành công' };
  }

  //  EVM STAFF MANAGEMENT
  async listEvmStaff() {
    const { data: usersData, error } = await this.admin.auth.admin.listUsers();
    if (error) {
      throw new BadRequestException('Không lấy được danh sách EVM staff: ' + error.message);
    }

    const users = usersData?.users || [];

    const staffs = users.filter((u: any) => {
      const meta = (u.user_metadata || {}) as any;
      return meta.role === 'evm_staff';
    });

    const now = new Date();

    return staffs.map((u: any) => {
      const meta = (u.user_metadata || {}) as any;
      const bannedUntil = (u as any).banned_until as string | null | undefined;

      const isLocked =
        bannedUntil && bannedUntil !== 'none' && new Date(bannedUntil).getTime() > now.getTime();

      return {
        id: u.id,
        email: u.email,
        full_name: meta.full_name || (u.email ? u.email.split('@')[0] : ''),
        phone: meta.phone || '',
        dealer_id: meta.dealer_id || null,
        dealer_name: meta.dealer_name || null,
        status: (isLocked ? 'locked' : 'active') as 'locked' | 'active',
        created_at: u.created_at,
      };
    });
  }

  // Tạo tài khoản EVM Staff
  async createEvmStaff(dto: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    dealer_id?: string;
  }) {
    const { full_name, email, password, phone, dealer_id } = dto;

    if (!full_name || !email || !password) {
      throw new BadRequestException('Họ tên, Email và Mật khẩu là bắt buộc');
    }
    if (password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email không hợp lệ');
    }

    try {
      // Kiểm tra email đã tồn tại chưa
      const { data: existingUsers } = await this.admin.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some((u: any) => u.email === email);

      if (emailExists) {
        throw new BadRequestException(`Email ${email} đã được sử dụng`);
      }

      // Tạo Supabase user với role = evm_staff
      const { data: createdUser, error: createErr } = await this.admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone: phone ?? '',
          role: 'evm_staff',
          dealer_id: dealer_id ?? null,
        },
      });

      if (createErr) {
        if (
          createErr.message.includes('already registered') ||
          createErr.message.includes('already exists')
        ) {
          throw new BadRequestException(`Email ${email} đã được sử dụng`);
        }
        throw new BadRequestException('Tạo tài khoản EVM staff thất bại: ' + createErr.message);
      }

      const user_id = createdUser.user?.id;
      if (!user_id) {
        throw new BadRequestException('Không nhận được user_id từ Supabase');
      }

      return {
        id: user_id,
        email,
        full_name,
        phone: phone ?? '',
        dealer_id: dealer_id ?? null,
        status: 'active' as const,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error?.message || 'Tạo EVM staff thất bại');
    }
  }

  // Cập nhật thông tin EVM Staff
  async updateEvmStaff(
    staffId: string,
    dto: { full_name?: string; phone?: string; dealer_id?: string | null },
  ) {
    const { data, error: getErr } = await this.admin.auth.admin.getUserById(staffId);
    if (getErr || !data?.user) {
      throw new BadRequestException('Không tìm thấy EVM staff cần cập nhật');
    }

    const staff = data.user;
    const meta = (staff.user_metadata || {}) as any;

    if (meta.role !== 'evm_staff') {
      throw new BadRequestException('Tài khoản này không phải EVM staff');
    }

    const newMeta = {
      ...meta,
      full_name: dto.full_name ?? meta.full_name,
      phone: dto.phone ?? meta.phone,
      dealer_id: dto.dealer_id === undefined ? meta.dealer_id : dto.dealer_id,
    };

    const { error: updateErr } = await this.admin.auth.admin.updateUserById(staffId, {
      user_metadata: newMeta,
    });

    if (updateErr) {
      throw new BadRequestException('Cập nhật EVM staff thất bại: ' + updateErr.message);
    }

    return {
      id: staffId,
      email: staff.email ?? '',
      full_name: newMeta.full_name || (staff.email ? staff.email.split('@')[0] : ''),
      phone: newMeta.phone || '',
      dealer_id: newMeta.dealer_id || null,
      status: 'active' as const,
    };
  }

  private async setEvmStaffStatusInternal(staffId: string, active: boolean) {
    const { data, error: getErr } = await this.admin.auth.admin.getUserById(staffId);
    if (getErr || !data?.user) {
      throw new BadRequestException('Không tìm thấy EVM staff');
    }

    const staff = data.user;
    const meta = (staff.user_metadata || {}) as any;

    if (meta.role !== 'evm_staff') {
      throw new BadRequestException('Tài khoản này không phải EVM staff');
    }

    const { error: updateErr } = await this.admin.auth.admin.updateUserById(staffId, {
      ban_duration: active ? 'none' : '876600h',
    });

    if (updateErr) {
      throw new BadRequestException('Thay đổi trạng thái EVM staff thất bại: ' + updateErr.message);
    }

    return {
      message: active ? 'Đã mở khóa tài khoản EVM staff' : 'Đã khóa tài khoản EVM staff',
    };
  }

  async lockEvmStaff(staffId: string) {
    return this.setEvmStaffStatusInternal(staffId, false);
  }

  async unlockEvmStaff(staffId: string) {
    return this.setEvmStaffStatusInternal(staffId, true);
  }
}
