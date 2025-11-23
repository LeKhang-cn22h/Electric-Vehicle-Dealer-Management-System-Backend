import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Contract } from './entity/contract.entity';
import { OrderService } from '../order/order.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PricingPromotionService } from '../pricing-promotion/pricing-promotion.service';

@Injectable()
export class ContractsService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
    private readonly orderService: OrderService,
    private readonly pricingPromotionService: PricingPromotionService,
    private readonly amqpConnection: AmqpConnection,
  ) {}
  async getVehicleId(id: number) {
    const response = await this.amqpConnection.request<{ vehicle: any }>({
      exchange: 'contract_vehicle',
      routingKey: 'contract.vehicle',
      payload: { id },
      timeout: 160000,
    });
    return response;
  }
  // Generate code kiểu: CT-2025-00001
  private async generateContractNumber(): Promise<string> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // Lấy tất cả contract của ngày hôm nay
    const { data, error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${now.toISOString().slice(0, 10)}T00:00:00+07:00`)
      .lte('created_at', `${now.toISOString().slice(0, 10)}T23:59:59+07:00`);

    if (error) throw new Error('Cannot generate contract number');

    const nextNumber = ((data?.length || 0) + 1).toString().padStart(4, '0');

    return `CT-${date}-${nextNumber}`;
  }

  async create(dto: CreateContractDto): Promise<Contract> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    // Lấy Order từ DB
    const { data: order, error: orderError } = await this.supabase
      .schema('sales')
      .from('orders')
      .select('*')
      .eq('id', dto.orderId)
      .single();

    if (orderError || !order) throw new NotFoundException('Order not found');

    // Tạo contractNumber tự động
    const contractNumber = await this.generateContractNumber();

    const newContract: Contract = {
      id: uuid(),
      orderId: dto.orderId,
      contractNumber,
      dealerId: order.dealer_id,
      contractValue: order.total_amount,
      startDate: dto.startDate ? new Date(dto.startDate) : now,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert vào DB
    const { error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .insert({
        id: newContract.id,
        order_id: newContract.orderId,
        contract_number: newContract.contractNumber,
        dealer_id: newContract.dealerId,
        description: newContract.description,
        contract_value: newContract.contractValue,
        start_date: newContract.startDate.toISOString(),
        end_date: newContract.endDate?.toISOString() || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    const response = await this.orderService.update(newContract.orderId, { status: 'confirmed' });
    console.log('Đã update', response);
    if (error) throw new Error(error.message);

    return newContract;
  }

  async findAll(): Promise<Contract[]> {
    const { data, error } = await this.supabase.schema('sales').from('contracts').select('*');

    if (error) throw new Error(error.message);
    return data.map(this.mapRow);
  }

  async findOne(id: string): Promise<any> {
    const { data: contract, error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contract) throw new NotFoundException('Contract not found');

    const { data: order, error: orderError } = await this.supabase
      .schema('sales')
      .from('orders')
      .select('*')
      .eq('id', contract.order_id)
      .single();

    if (orderError || !order) throw new NotFoundException('Order not found');

    // 2. Lấy quotation liên quan
    const { data: quotation, error: qError } = await this.supabase
      .schema('sales')
      .from('quotations')
      .select('*')
      .eq('id', order.quotation_id)
      .single();

    if (qError) throw new Error(qError.message);

    // 3. Lấy items của quotation
    const { data: items, error: itemsError } = await this.supabase
      .schema('sales')
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', order.quotation_id);

    if (itemsError) throw new Error(itemsError.message);

    const vehicle = await Promise.all(
      items.map(async (item) => await this.getVehicleId(item.product_id)),
    );

    const promotions = await Promise.all(
      quotation.promotion_code.map(
        async (promo_id) => await this.pricingPromotionService.findOnePromotion(promo_id),
      ),
    );
    // 4. Lấy thông tin customer
    const { data: customer, error: cError } = await this.supabase
      .schema('customer')
      .from('customers')
      .select('*')
      .eq('id', quotation.customer_id)
      .single();

    return {
      ...this.mapRow(contract),
      order: order,
      quotation: quotation,
      promotions: promotions,
      items: items || [],
      vehicles: vehicle || [],
      customer: customer || null,
    };
  }

  async update(id: string, dto: UpdateContractDto): Promise<Contract> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const updateData: any = {
      updated_at: now.toISOString(),
    };

    if (dto.startDate) updateData.start_date = new Date(dto.startDate).toISOString();
    if (dto.endDate) updateData.end_date = new Date(dto.endDate).toISOString();

    const { data, error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return this.mapRow(data);
  }

  async remove(id: string) {
    const { count, error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw new Error(error.message);
    if (count === 0) throw new NotFoundException('Contract not found');

    return { message: `Contract ${id} deleted successfully` };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      orderId: row.order_id,
      contractNumber: row.contract_number,
      dealerId: row.dealer_id,
      description: row.description,
      contractValue: row.contract_value,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
