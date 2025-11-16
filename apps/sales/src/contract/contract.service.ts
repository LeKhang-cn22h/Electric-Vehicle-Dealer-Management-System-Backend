import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { Contract } from './entity/contract.entity';

@Injectable()
export class ContractsService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private readonly supabase: SupabaseClient,
  ) {}

  async create(dto: CreateContractDto): Promise<Contract> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const newContract: Contract = {
      id: uuid(),
      contractNumber: dto.contractNumber,
      dealerId: dto.dealerId,
      description: dto.description,
      contractValue: dto.contractValue,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .insert({
        id: newContract.id,
        contract_number: newContract.contractNumber,
        dealer_id: newContract.dealerId,
        description: newContract.description,
        contract_value: newContract.contractValue,
        start_date: newContract.startDate.toISOString(),
        end_date: newContract.endDate?.toISOString() || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (error) throw new Error(error.message);
    return newContract;
  }

  async findAll(): Promise<Contract[]> {
    const { data, error } = await this.supabase.schema('sales').from('contracts').select('*');

    if (error) throw new Error(error.message);
    return data.map(this.mapRow);
  }

  async findOne(id: string): Promise<Contract> {
    const { data, error } = await this.supabase
      .schema('sales')
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Contract not found');
    return this.mapRow(data);
  }

  async update(id: string, dto: UpdateContractDto): Promise<Contract> {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const updateData = {
      contract_number: dto.contractNumber,
      dealer_id: dto.dealerId,
      description: dto.description,
      contract_value: dto.contractValue,
      start_date: dto.startDate,
      end_date: dto.endDate,
      updated_at: now.toISOString(),
    };

    if (dto.startDate) updateData['start_date'] = new Date(dto.startDate).toISOString();
    if (dto.endDate) updateData['end_date'] = new Date(dto.endDate).toISOString();

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

  private mapRow(row: any): Contract {
    return {
      id: row.id,
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
