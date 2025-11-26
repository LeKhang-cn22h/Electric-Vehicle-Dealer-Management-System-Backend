import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { CreateVehicleUnitDTO, VehicleCreateDto } from './DTO/vehicle_create.dto';
import { VehicleUpdateDto } from './DTO/vehicle_update.dto';
import { AmqpConnection, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  CreateVehicleUnitDto,
  UpdateVehicleUnitDto,
  DeployToWarehouseDto,
  DeployMultipleUnitsDto,
  FilterVehicleUnitsDto,
  PayVehicleDto,
} from './DTO/vehicle-unit.dto';
dotenv.config();

interface SearchFilters {
  keyword?: string;
  model?: string;
  status?: string;
  cursor?: number;
  limit?: number;
}

// Interface cho kết quả so sánh
export interface ComparisonResult {
  vehicles: any[];
  specs: any[];
}

@Injectable()
export class vehicleNewService {
  private supabase;

  constructor(private readonly amqpConnection: AmqpConnection) {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }

  async getVehicleWithPrice(vehicleId: number) {
    const response = await this.amqpConnection.request<{ vehicleId: number; price: number }>({
      exchange: 'vehicle_exchange',
      routingKey: 'price.request',
      payload: { vehicleId },
      timeout: 160000,
    });
    const vehicle = await this.findOne(vehicleId);
    return { ...vehicle, price: response.price };
  }

  async getListVehicleWithListPrice(vehicleIds: number[]) {
    console.log('[VehicleService] Getting vehicles with prices for IDs:', vehicleIds);

    // 1) Gọi RPC lấy list giá - 1 request cho tất cả IDs
    const priceList = await this.amqpConnection.request<
      Array<{ vehicleId: number; price: number }>
    >({
      exchange: 'vehicle_exchange',
      routingKey: 'listprice.request',
      payload: { vehicleIds }, // Gửi MẢNG IDs
      timeout: 10000,
    });

    console.log('priceList:', priceList);

    // 2) TỐI ƯU: Chỉ query NHỮNG XE CẦN THIẾT
    const { data: vehicles, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
      id,
      name,
      status,
      model,
      year,
      transmission,
      mileage,
      images(path, is_main)
    `,
      )
      .in('id', vehicleIds) // ← CHỈ lấy xe có ID trong mảng
      .order('id', { ascending: true });

    if (error) {
      console.error('[VehicleService] Query error:', error);
      throw new BadRequestException(error.message);
    }

    console.log(`[VehicleService] Found ${vehicles?.length || 0} vehicles from DB`);

    // 3) Map giá theo vehicleId
    const priceMap = new Map(priceList.map((p) => [p.vehicleId, p.price]));

    // 4) Merge giá vào dữ liệu xe + xử lý ảnh
    const result = vehicles.map((vehicle) => {
      // Xử lý ảnh chính
      let mainImage: { path: string; is_main?: boolean } | null = null;

      if (vehicle.images) {
        if (Array.isArray(vehicle.images)) {
          mainImage = vehicle.images.find((img) => img?.is_main) || vehicle.images[0];
        } else if (vehicle.images.path) {
          mainImage = vehicle.images;
        }
      }

      let imageUrl = 'https://via.placeholder.com/400x300?text=No+Image';
      if (mainImage?.path) {
        const { data: urlData } = this.supabase.storage
          .from('Vehicle')
          .getPublicUrl(mainImage.path);
        imageUrl = urlData.publicUrl;
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        status: vehicle.status || 'còn hàng',
        model: vehicle.model,
        year: vehicle.year,
        transmission: vehicle.transmission,
        mileage: vehicle.mileage,
        imageUrl,
        price: priceMap.get(vehicle.id) ?? null,
      };
    });

    console.log('Merged result:', result);
    return result;
  }

  async getListPrice(): Promise<any[]> {
    return this.amqpConnection.request<any[]>({
      exchange: 'vehicle_listPrice',
      routingKey: 'vehicle.listPrice',
      payload: {},
      timeout: 160000,
    });
  }

  @RabbitRPC({
    exchange: 'quotation_vehicle',
    routingKey: 'quotaion.vehicle',
    queue: 'quotaion_request_vehicle',
  })
  public async handleQuotationVehicle(msg: { id: number }) {
    return this.getVehicleWithPriceHandler(msg);
  }

  @RabbitRPC({
    exchange: 'order_vehicle',
    routingKey: 'order.vehicle',
    queue: 'order_request_vehicle',
  })
  public async handleOrderVehicle(msg: { id: number }) {
    return this.getVehicleWithPriceHandler(msg);
  }

  @RabbitRPC({
    exchange: 'contract_vehicle',
    routingKey: 'contract.vehicle',
    queue: 'contract_request_vehicle',
  })
  public async handleContractVehicle(msg: { id: number }) {
    return this.getVehicleWithPriceHandler(msg);
  }
  // Dùng chung function xử lý logic
  private async getVehicleWithPriceHandler(msg: { id: number }) {
    console.log('Received vehicle request:', msg);
    if (!msg.id) return null;
    return await this.getVehicleWithPrice(msg.id);
  }

  async getListVehicleWithNoPrice(): Promise<any> {
    const { data, error } = await this.supabase.schema('product').from('vehicle').select('*');
    if (error) throw new Error(error.message);
    const listPrice = await this.getListPrice();
    console.log(listPrice);
    const listPriceVehicleId = listPrice.map((price) => price.productId);
    console.log('listPriceVehicleId', listPriceVehicleId);
    const res = data.filter((vehicle) => !listPriceVehicleId.includes(vehicle.id));

    return res;
  }

  // ===========================
  // TÍNH NĂNG SO SÁNH XE
  // ===========================

  /**
   * So sánh nhiều xe với nhau
   * @param vehicleIds - Mảng ID các xe cần so sánh
   */
  async compareVehicles(vehicleIds: number[]): Promise<ComparisonResult> {
    console.log('[VehicleService] So sánh các xe với IDs:', vehicleIds);

    // Kiểm tra số lượng xe
    if (vehicleIds.length < 2) {
      throw new BadRequestException('Cần ít nhất 2 xe để so sánh');
    }
    if (vehicleIds.length > 4) {
      throw new BadRequestException('Chỉ có thể so sánh tối đa 4 xe');
    }

    // Lấy thông tin chi tiết của tất cả xe
    const vehiclesPromises = vehicleIds.map((id) => this.getVehicleForComparison(id));
    const vehicles = await Promise.all(vehiclesPromises);

    // Kiểm tra nếu có xe không tồn tại
    const validVehicles = vehicles.filter((vehicle) => vehicle !== null);
    if (validVehicles.length !== vehicles.length) {
      console.warn('[VehicleService] Một số xe không tồn tại đã được lọc bỏ');
    }

    if (validVehicles.length < 2) {
      throw new BadRequestException('Không đủ xe hợp lệ để so sánh');
    }

    console.log('[VehicleService] So sánh thành công cho', validVehicles.length, 'xe');

    return {
      vehicles: validVehicles,
      specs: this.generateComparisonSpecs(),
    };
  }

  /**
   * Lấy thông tin xe phục vụ cho việc so sánh
   */
  private async getVehicleForComparison(id: number): Promise<any> {
    try {
      console.log(`[VehicleService] Đang lấy thông tin xe ID: ${id} để so sánh`);

      const { data, error } = await this.supabase
        .schema('product')
        .from('vehicle')
        .select(
          `
          id,
          name,
          model,
          version,
          year,
          engine,
          transmission,
          mileage,
          color,
          seats,
          origin,
          description,
          status,
          images(path, is_main)
        `,
        )
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error(`[VehicleService] Không tìm thấy xe ID: ${id}`, error);
        return null;
      }

      // Xử lý ảnh chính
      let mainImageUrl = 'https://via.placeholder.com/400x300?text=Không+có+ảnh';

      if (data.images) {
        let mainImage: { path: string; is_main?: boolean } | null = null;

        if (Array.isArray(data.images)) {
          mainImage = data.images.find((img) => img?.is_main) || data.images[0];
        } else if (data.images.path) {
          mainImage = data.images;
        }

        if (mainImage?.path) {
          const { data: urlData } = this.supabase.storage
            .from('Vehicle')
            .getPublicUrl(mainImage.path);
          mainImageUrl = urlData.publicUrl;
        }
      }

      // Format dữ liệu để phù hợp
      const formattedVehicle = {
        id: data.id,
        name: data.name,
        src: mainImageUrl,
        // Các trường theo specs
        version: data.version || '-',
        model: data.model || '-',
        year: data.year || '-',
        engine: data.engine || '-',
        transmission: data.transmission || '-',
        mileage: data.mileage ? `${data.mileage.toLocaleString()} km` : '-',
        color: data.color || '-',
        seats: data.seats ? `${data.seats} chỗ` : '-',
        origin: data.origin || '-',
        status: data.status || 'còn hàng',
        description: data.description || '-',
      };

      console.log(`[VehicleService] Đã xử lý xe ID: ${id} - ${data.name}`);

      return formattedVehicle;
    } catch (error) {
      console.error(`[VehicleService] Lỗi khi lấy thông tin xe ID: ${id}`, error);
      return null;
    }
  }

  private generateComparisonSpecs(): any[] {
    // Theo đúng specs định nghĩa trong FE
    return [
      { label: 'Phiên bản', key: 'version' },
      { label: 'Dòng xe', key: 'model' },
      { label: 'Năm sản xuất', key: 'year' },
      { label: 'Động cơ', key: 'engine' },
    ];
  }

  async findAll(filters?: SearchFilters) {
    console.log('================ VEHICLE SEARCH DEBUG ================');
    console.log('[VehicleService] Incoming filters:', filters);

    const { keyword, model, status, cursor, limit = 20 } = filters || {};

    // Log riêng khi SEARCH
    if (keyword) {
      console.log('[VehicleService] SEARCH MODE ENABLED');
      console.log('[VehicleService] Keyword received:', keyword);
    }

    let req = this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
        id,
        name,
        status,
        model,
        year,
        transmission,
        mileage,
        images(path, is_main)
      `,
        { count: 'exact' },
      )
      .order('id', { ascending: true })
      .limit(limit);

    // ===========================
    // 🔍 Keyword filter
    // ===========================
    if (keyword) {
      const orQuery = `name.ilike.%${keyword}%,model.ilike.%${keyword}%,version.ilike.%${keyword}%`;
      console.log('[VehicleService] Applying keyword filter:', orQuery);

      req = req.or(orQuery);
    }

    // Model filter
    if (model) {
      console.log('[VehicleService] 🔧 Applying model filter:', model);
      req = req.ilike('model', `%${model}%`);
    }

    // Status filter
    if (status) {
      console.log('[VehicleService] 🔧 Applying status filter:', status);
      req = req.eq('status', status);
    }

    // Cursor (pagination)
    if (cursor) {
      console.log('[VehicleService] 🔧 Applying cursor >', cursor);
      req = req.gt('id', cursor);
    }

    console.log('[VehicleService] Executing SQL request now...');

    const { data, error, count } = await req;

    if (error) {
      console.error('[VehicleService] Query error:', error);
      throw new BadRequestException(error.message);
    }

    console.log('[VehicleService] Query executed successfully');
    console.log('[VehicleService] Total rows returned:', data?.length);
    console.log('[VehicleService] Total matches (count):', count);

    if (!data || data.length === 0) {
      console.warn('[VehicleService] ⚠ No vehicles matched your search.');
      return {
        data: [],
        nextCursor: null,
        total: count || 0,
      };
    }

    const nextCursor = data[data.length - 1].id;

    const vehiclesWithUrl = data.map((v) => {
      console.log(`[VehicleService] Processing vehicle ${v.id}, images:`, v.images);

      let mainImage: { path: string; is_main?: boolean } | null = null;

      if (v.images) {
        if (Array.isArray(v.images)) {
          mainImage = v.images.find((img) => img?.is_main) || v.images[0];
        } else if (v.images.path) {
          mainImage = v.images;
        }
      }

      let imageUrl = 'https://via.placeholder.com/400x300?text=No+Image';

      if (mainImage?.path) {
        const { data: urlData } = this.supabase.storage
          .from('Vehicle')
          .getPublicUrl(mainImage.path);

        imageUrl = urlData.publicUrl;
      }

      return {
        id: v.id,
        name: v.name,
        status: v.status || 'còn hàng',
        model: v.model,
        year: v.year,
        transmission: v.transmission,
        mileage: v.mileage,
        imageUrl,
      };
    });

    console.log('[VehicleService] Processed', vehiclesWithUrl.length, 'vehicles');

    return {
      data: vehiclesWithUrl,
      nextCursor,
      total: count || 0,
    };
  }

  // Phương thức search all (alias của findAll với keyword)
  async searchAll(keyword: string, cursor?: number, limit = 20) {
    return this.findAll({
      keyword,
      cursor,
      limit,
    });
  }

  // Phương thức filter by model
  async filterByModel(model: string, cursor?: number, limit = 20) {
    return this.findAll({
      model,
      cursor,
      limit,
    });
  }

  // Phương thức get all models (cho dropdown)
  async getAllModels() {
    console.log('[VehicleService] Fetching all models...');

    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select('model')
      .not('model', 'is', null)
      .order('model', { ascending: true });

    if (error) {
      console.error('[VehicleService] Query error:', error);
      throw new BadRequestException(error.message);
    }

    // Lấy unique models và loại bỏ null/undefined
    const uniqueModels = [
      ...new Set(data.map((item) => item.model).filter((model) => model && model.trim() !== '')),
    ];

    console.log('[VehicleService] Found', uniqueModels.length, 'unique models');

    return uniqueModels;
  }

  async findOne(id: number) {
    console.log('[VehicleService] Fetching vehicle ID:', id);

    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
            *,
            benefits(*),
            images(*),
            features(*)
        `,
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('[VehicleService] Query error:', error);
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new BadRequestException('Vehicle not found');
    }

    console.log('[VehicleService] Found vehicle:', data.name);

    // Transform images: path → publicUrl
    const imagesWithUrl =
      data.images?.map((img: any) => {
        const { data: urlData } = this.supabase.storage.from('Vehicle').getPublicUrl(img.path);

        return {
          id: img.id,
          path: img.path,
          is_main: img.is_main,
          imageUrl: urlData.publicUrl,
        };
      }) || [];

    // Return formatted data
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      tagline: data.tagline,
      year: data.year,
      mileage: data.mileage,
      transmission: data.transmission,
      color: data.color,
      engine: data.engine,
      seats: data.seats,
      origin: data.origin,
      description: data.description,
      model: data.model,
      version: data.version,
      images: imagesWithUrl,
      benefits: data.benefits || [],
      features: data.features || [],
      updated_at: data.updated_at,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(dto: VehicleCreateDto, images: Express.Multer.File[]) {
    console.log('[VehicleService] Creating new vehicle...');
    console.log('[VehicleService] Full DTO received:', dto);

    const { images: _, benefits, features, ...vehicleData } = dto;

    console.log('[VehicleService] Data to insert into vehicle table:', vehicleData);
    console.log('[VehicleService] Removed fields:', {
      imagesFromJson: _?.length,
      benefits: benefits?.length,
      features: features?.length,
    });

    // 2️⃣ Insert CHỈ vehicle data (không có images, benefits, features, id)
    const { data: vehicleRes, error: vehicleErr } = await this.supabase
      .schema('product')
      .from('vehicle')
      .insert(vehicleData)
      .select()
      .single();

    if (vehicleErr) {
      console.error('[VehicleService] Insert vehicle error:', vehicleErr);
      throw new BadRequestException(vehicleErr.message);
    }

    const vehicleId = vehicleRes.id;
    console.log('[VehicleService] Vehicle created with ID:', vehicleId);

    // 3️⃣ Upload & insert images (từ multer files, KHÔNG dùng images từ JSON)
    if (images && images.length > 0) {
      console.log('[VehicleService] Uploading', images.length, 'images...');

      for (const file of images) {
        const fileName = `${vehicleId}_${Date.now()}_${file.originalname}`;

        const { error: uploadErr } = await this.supabase.storage
          .from('Vehicle')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadErr) {
          console.error('[VehicleService] Upload error:', uploadErr);
          throw new BadRequestException(uploadErr.message);
        }

        const { error: imgErr } = await this.supabase.schema('product').from('images').insert({
          car_id: vehicleId,
          path: fileName,
          is_main: false,
        });

        if (imgErr) {
          console.error('[VehicleService] Insert image error:', imgErr);
          throw new BadRequestException(imgErr.message);
        }
      }
      console.log('[VehicleService] Images uploaded successfully');
    }

    // 4️⃣ Insert benefits
    if (benefits?.length) {
      console.log('[VehicleService] Inserting', benefits.length, 'benefits...');

      const beneRows = benefits.map((b) => ({
        car_id: vehicleId,
        benefit: b.benefit,
      }));

      const { error } = await this.supabase.schema('product').from('benefits').insert(beneRows);

      if (error) {
        console.error('[VehicleService] Insert benefits error:', error);
        throw new BadRequestException(error.message);
      }
      console.log('[VehicleService] Benefits inserted successfully');
    }

    // 5️⃣ Insert features
    if (features?.length) {
      console.log('[VehicleService] Inserting', features.length, 'features...');

      const featureRows = features.map((f) => ({
        car_id: vehicleId,
        category: f.category,
        item: f.item,
      }));

      const { error } = await this.supabase.schema('product').from('features').insert(featureRows);

      if (error) {
        console.error('[VehicleService] Insert features error:', error);
        throw new BadRequestException(error.message);
      }
      console.log('[VehicleService] Features inserted successfully');
    }

    console.log('[VehicleService] Vehicle created successfully with ID:', vehicleId);

    return {
      success: true,
      vehicleId,
      message: 'Vehicle created successfully',
    };
  }

  async update(id: number, dto: VehicleUpdateDto, images?: Express.Multer.File[]) {
    console.log('[VehicleService] Updating vehicle ID:', id);

    // Tách data
    const { images: _, benefits, features, ...vehicleData } = dto;

    // 1️⃣ Update bảng vehicle
    const { error: updateError } = await this.supabase
      .schema('product')
      .from('vehicle')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[VehicleService] Update vehicle error:', updateError);
      throw new BadRequestException(updateError.message);
    }

    console.log('[VehicleService] Vehicle updated');

    // 2️⃣ Update images (nếu có upload mới)
    if (images && images.length > 0) {
      console.log('[VehicleService] Updating images...');

      // Xóa ảnh cũ trong DB (không xóa trong Storage để tránh mất data)
      await this.supabase.schema('product').from('images').delete().eq('car_id', id);

      // Upload ảnh mới
      for (const file of images) {
        const fileName = `${id}_${Date.now()}_${file.originalname}`;

        const { error: uploadErr } = await this.supabase.storage
          .from('Vehicle')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (uploadErr) {
          console.error('[VehicleService] Upload error:', uploadErr);
          throw new BadRequestException(uploadErr.message);
        }

        // Insert vào DB
        const { error: imgErr } = await this.supabase.schema('product').from('images').insert({
          car_id: id,
          path: fileName,
          is_main: false,
        });

        if (imgErr) {
          console.error('[VehicleService] Insert image error:', imgErr);
          throw new BadRequestException(imgErr.message);
        }
      }

      console.log('[VehicleService] Images updated successfully');
    }

    // 3️⃣ Update benefits (nếu có trong DTO)
    if (benefits) {
      console.log('[VehicleService] Updating benefits...');

      await this.supabase.schema('product').from('benefits').delete().eq('car_id', id);

      const newBenefits = benefits.map((b) => ({
        car_id: id,
        benefit: b.benefit,
      }));

      const { error: beneErr } = await this.supabase
        .schema('product')
        .from('benefits')
        .insert(newBenefits);

      if (beneErr) {
        console.error('[VehicleService] Insert benefits error:', beneErr);
        throw new BadRequestException(beneErr.message);
      }

      console.log('[VehicleService] Benefits updated successfully');
    }

    // 4️⃣ Update features (nếu có trong DTO)
    if (features) {
      console.log('[VehicleService] Updating features...');

      await this.supabase.schema('product').from('features').delete().eq('car_id', id);

      const newFeatures = features.map((f) => ({
        car_id: id,
        category: f.category,
        item: f.item,
      }));

      const { error: featErr } = await this.supabase
        .schema('product')
        .from('features')
        .insert(newFeatures);

      if (featErr) {
        console.error('[VehicleService] Insert features error:', featErr);
        throw new BadRequestException(featErr.message);
      }

      console.log('[VehicleService] Features updated successfully');
    }

    console.log('[VehicleService] Vehicle updated successfully, ID:', id);

    return { message: 'Updated successfully', id };
  }

  async remove(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .update({ status: 'hết hàng' })
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);

    return {
      message: 'hàng đã hết',
      data,
    };
  }
  //gợi ý sản phẩm mới
  async getNewArrivals(limit: number = 6) {
    console.log('[VehicleService] Fetching new arrivals...');

    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
      id,
      name,
      model,
      version,
      images(path, is_main)
    `,
      );

    if (error) {
      console.error('[VehicleService] New arrival error:', error);
      throw new BadRequestException(error.message);
    }

    return data.map((v) => {
      const main = v.images?.find((i) => i.is_main) || v.images?.[0];
      let url = 'https://via.placeholder.com/300x200?text=No+Image';

      if (main?.path) {
        const { data: urlData } = this.supabase.storage.from('Vehicle').getPublicUrl(main.path);

        url = urlData.publicUrl;
      }

      return {
        id: v.id,
        name: v.name,
        model: v.model,
        version: v.version,
        imageUrl: url,
      };
    });
  }
  //gợi ý xe tương tự
  async getSimilarVehicles(vehicleId: number, limit: number = 6) {
    console.log('[VehicleService] Fetching similar vehicles for ID:', vehicleId);

    // 1) Lấy thông tin xe gốc
    const vehicle = await this.findOne(vehicleId);
    if (!vehicle) {
      throw new BadRequestException('Vehicle not found');
    }

    const filters: string[] = [];

    if (vehicle.model) filters.push(`model.eq.${vehicle.model}`);
    if (vehicle.version) filters.push(`version.eq.${vehicle.version}`);

    const OR_CONDITION = filters.join(',');

    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
      id,
      name,
      model,
      version,
      images(path, is_main)
    `,
      )
      .neq('id', vehicleId)
      .or(OR_CONDITION)
      .limit(limit);

    if (error) {
      console.error('[VehicleService] Similar vehicle error:', error);
      throw new BadRequestException(error.message);
    }

    return data.map((v) => {
      const main = v.images?.find((i) => i.is_main) || v.images?.[0];
      let url = 'https://via.placeholder.com/300x200?text=No+Image';

      if (main?.path) {
        const { data: urlData } = this.supabase.storage.from('Vehicle').getPublicUrl(main.path);

        url = urlData.publicUrl;
      }

      return {
        id: v.id,
        name: v.name,
        model: v.model,
        version: v.version,
        imageUrl: url,
      };
    });
  }

  // ============================================
  // VEHICLE UNIT
  // ============================================
  //HÀM TẠO XE ĐƠN VỊ
  async createVehicleUnit(dto: CreateVehicleUnitDto) {
    console.log('[VehicleService] Creating vehicle unit...', dto);
    const { vehicle_id, vin, color, status = 'available' } = dto;

    // 1. Kiểm tra vehicle tồn tại
    const { data: vehicle, error: vehicleErr } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select('id, name')
      .eq('id', vehicle_id)
      .single();

    if (vehicleErr || !vehicle) {
      throw new BadRequestException('Vehicle không tồn tại');
    }

    console.log('[VehicleService] Vehicle exists:', vehicle.name);

    // 2. Kiểm tra VIN trùng
    const { data: vinCheck } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('id')
      .eq('vin', vin)
      .maybeSingle();

    if (vinCheck) {
      throw new BadRequestException('VIN đã tồn tại trong kho');
    }

    // 3. Tạo vehicle unit
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .insert({
        vehicle_id,
        vin,
        color,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('[VehicleService] Insert vehicle unit error:', error);
      throw new BadRequestException(error.message);
    }

    console.log('[VehicleService] Vehicle unit created:', data);

    return {
      success: true,
      message: 'Tạo xe đơn vị (vehicle unit) thành công',
      unit: data,
    };
  }

  // ============================================
  // VEHICLE UNIT - GET ALL
  // ============================================
  //LẤY TẤT CẢ VEHICLE UNIT VỚI BỘ LỌC
  async getAllVehicleUnits(filters?: FilterVehicleUnitsDto) {
    let query = this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select(
        `
        *,
        vehicle:vehicle_id (
          id,
          name,
          model,
          version,
          year
        )
      `,
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.warehouse_id !== undefined) {
      if (filters.warehouse_id === null) {
        query = query.is('warehouse_id', null);
      } else {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      data,
      total: data?.length || 0,
    };
  }
  //lấy vehicle unit theo nhóm vehicle id
  async getGroupUnit(vehicleId: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('id', { ascending: true }); // sắp xếp theo id nếu muốn

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      vehicle_id: vehicleId,
      units: data,
      total: data?.length || 0,
    };
  }
  // ============================================
  // VEHICLE UNIT - GET ONE
  // ============================================
  // HÀM LẤY THÔNG TIN VEHICLE UNIT THEO ID
  async getVehicleUnitById(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select(
        `
        *,
        vehicle:vehicle_id (
          id,
          name,
          model,
          version,
          year,
          fuel_type,
          transmission,
          engine,
          seats
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Vehicle unit với ID ${id} không tồn tại`);
    }

    return {
      success: true,
      data,
    };
  }
  // HÀM LẤY THÔNG TIN VEHICLE UNIT THEO VIN
  async getVehicleUnitByVIN(vin: string) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select(
        `
        *,
        vehicle:vehicle_id (
          id,
          name,
          model,
          version,
          year
        )
      `,
      )
      .eq('vin', vin)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Vehicle unit với VIN ${vin} không tồn tại`);
    }

    return {
      success: true,
      data,
    };
  }

  // ============================================
  // VEHICLE UNIT - UPDATE
  // ============================================
  // HÀM DÙNG ĐỂ CẬP NHẬT THÔNG TIN VEHCLE UNIT
  async updateVehicleUnit(id: number, dto: UpdateVehicleUnitDto) {
    // 1. Kiểm tra unit tồn tại
    await this.getVehicleUnitById(id);

    // 2. Nếu update VIN, kiểm tra trùng
    if (dto.vin) {
      const { data: vinCheck } = await this.supabase
        .schema('product')
        .from('vehicle_unit')
        .select('id')
        .eq('vin', dto.vin)
        .neq('id', id)
        .maybeSingle();

      if (vinCheck) {
        throw new BadRequestException('VIN đã tồn tại trong hệ thống');
      }
    }

    // 3. Update
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Cập nhật vehicle unit thành công',
      data,
    };
  }

  // ============================================
  // VEHICLE UNIT - DELETE
  // ============================================
  //HÀM DÙNG ĐỂ XÓA VEHICLE UNIT
  async deleteVehicleUnit(id: number) {
    const unit = await this.getVehicleUnitById(id);

    if (unit.data.status === 'sold' || unit.data.status === 'paid') {
      throw new BadRequestException('Không thể xóa xe đã bán hoặc đã thanh toán');
    }

    if (unit.data.warehouse_id) {
      throw new BadRequestException('Không thể xóa xe đã được điều phối xuống kho');
    }

    const { error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Xóa vehicle unit thành công',
    };
  }

  // ============================================
  // COUNT UNDEPLOYED UNITS
  // ============================================
  //HÀM DÙNG ĐỂ ĐẾM SỐ LƯỢNG XE CHƯA ĐƯỢC ĐIỀU PHỐI
  async countUndeployedUnits(vehicleId: number) {
    const { count, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .is('warehouse_id', null)
      .in('status', ['available', 'reserved']);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      vehicle_id: vehicleId,
      undeployed_count: count || 0,
    };
  }
  // HÀM ĐẾM SỐ LƯỢNG XE ĐƠN VỊ CHƯA ĐƯỢC ĐIỀU PHỐI THEO NHÓM VEHICLE
  async countUnallocatedUnitsByVehicle(vehicleId: number) {
    const { count, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'available'); // chưa điều phối

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      vehicle_id: vehicleId,
      count,
    };
  }

  // ============================================
  // DEPLOY TO WAREHOUSE - SINGLE
  // ============================================
  //HÀM ĐIỀU PHỐI XE CUỐNG KHO
  async deployUnitToWarehouse(unitId: number, warehouseId: number) {
    const unit = await this.getVehicleUnitById(unitId);

    if (unit.data.warehouse_id) {
      throw new BadRequestException(`Xe này đã được điều phối xuống kho ${unit.data.warehouse_id}`);
    }

    if (unit.data.status !== 'available') {
      throw new BadRequestException(
        `Chỉ có thể điều phối xe có trạng thái 'available'. Trạng thái hiện tại: ${unit.data.status}`,
      );
    }

    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .update({
        warehouse_id: warehouseId,
        status: 'deployed',
      })
      .eq('id', unitId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: `Điều phối xe xuống kho ${warehouseId} thành công`,
      data,
    };
  }

  // ============================================
  // DEPLOY TO WAREHOUSE - MULTIPLE
  // ============================================
  // HÀM ĐIỀU PHỐI NHIỀU XE XUỐNG KHO không quan tâm ids ngẫu nhiên chỉ dựa vào số lượng
  async deployMultipleUnitsToWarehouse(dto: DeployMultipleUnitsDto) {
    const { vehicle_id, warehouse_id, quantity } = dto;

    const { data: availableUnits, error: fetchError } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('id, vin')
      .eq('vehicle_id', vehicle_id)
      .eq('status', 'available')
      .is('warehouse_id', null)
      .limit(quantity);

    if (fetchError) {
      throw new BadRequestException(fetchError.message);
    }

    if (!availableUnits || availableUnits.length === 0) {
      throw new BadRequestException('Không có xe nào sẵn sàng để điều phối');
    }

    if (availableUnits.length < quantity) {
      throw new BadRequestException(
        `Chỉ có ${availableUnits.length} xe sẵn sàng, không đủ ${quantity} xe`,
      );
    }

    const unitIds = availableUnits.map((u) => u.id);

    const { data, error: updateError } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .update({
        warehouse_id,
        status: 'deployed',
      })
      .in('id', unitIds)
      .select();

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return {
      success: true,
      message: `Điều phối ${data.length} xe xuống kho ${warehouse_id} thành công`,
      deployed_units: data,
    };
  }

  // ============================================
  // DEPLOY TO WAREHOUSE - BATCH
  // ============================================
  //HÀM ĐIỀU PHỐI NHIỀU XE XUỐNG KHO THEO DANH SÁCH ID quan tâm ids
  async deployUnitsToWarehouse(dto: DeployToWarehouseDto) {
    const { vehicle_unit_ids, warehouse_id } = dto;

    const { data: units, error: fetchError } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('id, vin, warehouse_id, status')
      .in('id', vehicle_unit_ids);

    if (fetchError) {
      throw new BadRequestException(fetchError.message);
    }

    if (units.length !== vehicle_unit_ids.length) {
      throw new BadRequestException('Một số vehicle units không tồn tại');
    }

    const alreadyDeployed = units.filter((u) => u.warehouse_id !== null);
    if (alreadyDeployed.length > 0) {
      throw new BadRequestException(
        `Các xe sau đã được điều phối: ${alreadyDeployed.map((u) => u.vin).join(', ')}`,
      );
    }

    const unavailable = units.filter((u) => u.status !== 'available');
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Các xe sau không ở trạng thái 'available': ${unavailable.map((u) => u.vin).join(', ')}`,
      );
    }

    const { data, error: updateError } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .update({
        warehouse_id,
        status: 'deployed',
      })
      .in('id', vehicle_unit_ids)
      .select();

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    return {
      success: true,
      message: `Điều phối ${data.length} xe xuống kho ${warehouse_id} thành công`,
      deployed_units: data,
    };
  }

  // ============================================
  // PAY VEHICLE
  // ============================================
  // HÀM THANH TOÁN XE KHI BÁN 1 CHIẾC XE
  async payVehicle(dto: PayVehicleDto) {
    const { vin } = dto;

    const unit = await this.getVehicleUnitByVIN(vin);

    if (unit.data.status === 'sold' || unit.data.status === 'paid') {
      throw new BadRequestException('Xe này đã được bán');
    }

    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle_unit')
      .update({
        status: 'sold',
      })
      .eq('vin', vin)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Thanh toán xe thành công',
      data,
    };
  }
  // ============================================
  // GET AVAILABLE UNITS
  // ============================================
  // HÀM LẤY DANH SÁCH XE ĐƠN VỊ CÒN TỒN THEO NHÓM VEHICLE
  async getAvailableUnitsByVehicle(vehicleId: number, warehouseId?: number) {
    let query = this.supabase
      .schema('product')
      .from('vehicle_unit')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'available');

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      data,
      total: data?.length || 0,
    };
  }
}
