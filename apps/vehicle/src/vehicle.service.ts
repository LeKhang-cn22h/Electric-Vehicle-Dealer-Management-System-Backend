import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { VehicleCreateDto } from './DTO/vehicle_create.dto';
import { VehicleUpdateDto } from './DTO/vehicle_update.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

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
export class VehicleService {
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
          power_hp,
          fuel_consumption,
          fuel_type,
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
        power: data.power_hp ? `${data.power_hp} HP` : '-',
        fuel: data.fuel_consumption ? `${data.fuel_consumption} L/100km` : data.fuel_type || '-',
        // Các trường bổ sung có thể dùng để mở rộng
        fuel_type: data.fuel_type || '-',
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
      { label: 'Công suất (HP)', key: 'power' },
      { label: 'Mức tiêu thụ nhiên liệu', key: 'fuel' },
    ];
  }

  /**
   * Lấy danh sách xe gợi ý để so sánh (cùng dòng xe)
   */
  async getComparisonSuggestions(vehicleId: number, limit = 5) {
    console.log(`[VehicleService] Lấy xe gợi ý so sánh cho ID: ${vehicleId}`);

    // Lấy thông tin xe hiện tại để biết dòng xe
    const { data: currentVehicle, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select('model')
      .eq('id', vehicleId)
      .single();

    if (error || !currentVehicle) {
      throw new BadRequestException('Không tìm thấy xe');
    }

    // Lấy các xe cùng dòng (trừ xe hiện tại)
    const { data: suggestions, error: suggestError } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
        id,
        name,
        model,
        version,
        year,
        images(path, is_main)
      `,
      )
      .eq('model', currentVehicle.model)
      .neq('id', vehicleId)
      .eq('status', 'còn hàng')
      .limit(limit);

    if (suggestError) {
      console.error('[VehicleService] Lỗi khi lấy xe gợi ý:', suggestError);
      throw new BadRequestException(suggestError.message);
    }

    // Xử lý ảnh cho các xe gợi ý
    const suggestionsWithImages = suggestions.map((vehicle) => {
      let imageUrl = 'https://via.placeholder.com/200x150?text=Không+có+ảnh';

      if (vehicle.images) {
        let mainImage: { path: string; is_main?: boolean } | null = null;

        if (Array.isArray(vehicle.images)) {
          mainImage = vehicle.images.find((img) => img?.is_main) || vehicle.images[0];
        } else if (vehicle.images.path) {
          mainImage = vehicle.images;
        }

        if (mainImage?.path) {
          const { data: urlData } = this.supabase.storage
            .from('Vehicle')
            .getPublicUrl(mainImage.path);
          imageUrl = urlData.publicUrl;
        }
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        model: vehicle.model,
        version: vehicle.version,
        year: vehicle.year,
        imageUrl,
      };
    });

    console.log(`[VehicleService] Tìm thấy ${suggestionsWithImages.length} xe gợi ý`);

    return suggestionsWithImages;
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
        fuel_type,
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
        fuel_type: v.fuel_type,
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
      fuel_type: data.fuel_type,
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
      created_at: data.created_at,
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
}
