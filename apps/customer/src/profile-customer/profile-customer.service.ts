import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCustomerDto } from './DTO/create-customer.dto';
import { UpdateCustomerDto } from './DTO/update-customer.dto';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ProfileCustomerService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // ==========================
  // CRUD API USING SUPABASE
  // ==========================
  @RabbitRPC({
    exchange: 'customer_quotaion', // Exchange để nhận message
    routingKey: 'quotaion.customer', // Routing key để filter message
    queue: 'quotaion_request_customer', // Queue để message tồn tại nếu consumer offline
  })
  public async quotationRequestCustomer(msg: { id: number }) {
    console.log('Received customer request:', msg);
    const customer = await this.findOne(msg.id);
    return customer;
  }

  async findAll() {
    const { data, error } = await this.supabase.schema('customer').from('customers').select('*');

    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    // console.log(data);
    return data;
  }

  async create(payload: CreateCustomerDto) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .insert(payload)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: number, payload: UpdateCustomerDto) {
    const { data, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  // profile-customer.service.ts
  async remove(id: number) {
    console.log(`[CustomerService] 🗑️ Starting soft delete for customer ID: ${id}`);

    try {
      const { data: existing, error: checkError } = await this.supabase
        .schema('customer')
        .from('customers')
        .select('id, name, status')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error(`[CustomerService] ❌ Customer not found:`, checkError);
        throw new Error(`Customer not found: ${checkError.message}`);
      }

      console.log(`[CustomerService]  Found customer:`, existing);

      // Thực hiện update
      const { data, error } = await this.supabase
        .schema('customer')
        .from('customers')
        .update({
          status: false,
        })
        .eq('id', id)
        .select();

      console.log(`[CustomerService] 🔄 Update result:`, { data, error });

      if (error) {
        console.error(`[CustomerService] ❌ Update error:`, error);
        throw new Error(`Database error: ${error.message} (${error.code})`);
      }

      console.log(`[CustomerService] ✅ Successfully soft deleted customer ID: ${id}`);
      return {
        message: 'Customer deleted successfully',
        affected: data?.length || 0,
        customer: data?.[0],
      };
    } catch (error) {
      console.error(`[CustomerService] 🚨 Catch block error:`, error);
      throw error;
    }
  }
  // hàm tìm hồ sơ dành cho khách
  async findAndLinkByEmailOrPhone(email: string | null, phone: string | null, accountUid: string) {
    // 1. Tìm theo email hoặc phone
    const { data: customer, error } = await this.supabase
      .schema('customer')
      .from('customers')
      .select('*')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle(); // nếu không có trả null không crash

    if (error) throw new Error(error.message);

    // 2. Không tìm thấy hồ sơ
    if (!customer) {
      return {
        found: false,
        message: 'Không tìm thấy hồ sơ trùng email hoặc số điện thoại.',
      };
    }

    // 3. Nếu hồ sơ đã có UID thì không ghi đè
    if (customer.uid) {
      return {
        found: true,
        linked: false,
        message: 'Hồ sơ đã được liên kết tài khoản trước đó.',
        profile: this.removeUid(customer),
      };
    }

    // 4. Tự động cập nhật UID
    const { data: updated, error: updateError } = await this.supabase
      .schema('customer')
      .from('customers')
      .update({ uid: accountUid })
      .eq('id', customer.id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return {
      found: true,
      linked: true,
      message: 'Đã tự động liên kết tài khoản với hồ sơ.',
      profile: this.removeUid(updated),
    };
  }
  private removeUid(customer: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { account_uid, ...rest } = customer;
    return rest;
  }
}
