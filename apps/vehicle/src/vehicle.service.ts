import { BadRequestException, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { VehicleCreateDto } from './DTO/vehicle_create.dto';
import { VehicleUpdateDto } from './DTO/vehicle_update.dto';

dotenv.config();
@Injectable()
export class VehicleService {
  private supabase;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }

  async findAll(cursor?: number, limit = 20) {
    console.log('[VehicleService] Fetching vehicles...');

    let req = this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
            id,
            name,
            status,
            images(path, is_main)
        `,
      )
      .order('id', { ascending: true })
      .limit(limit);

    if (cursor) {
      req = req.gt('id', cursor);
    }

    const { data, error } = await req;

    if (error) {
      console.error('[VehicleService] Query error:', error);
      throw new BadRequestException(error.message);
    }

    if (!data || data.length === 0) {
      console.log('[VehicleService] No vehicles found');
      return {
        data: [],
        nextCursor: null,
      };
    }

    console.log('[VehicleService] Fetched', data.length, 'vehicles');
    console.log('[VehicleService] First vehicle:', JSON.stringify(data[0], null, 2));

    const nextCursor = data[data.length - 1].id;

    // Map với error handling đầy đủ
    const vehiclesWithUrl = data.map((v) => {
      console.log(`[VehicleService] Processing vehicle ${v.id}, images:`, v.images);

      // Xử lý images - có thể là array, object, hoặc null
      let mainImage: { path: string; is_main?: boolean } | null = null; // ← FIX: Thêm type

      if (v.images) {
        if (Array.isArray(v.images)) {
          // Nếu là array, tìm ảnh is_main hoặc lấy ảnh đầu tiên
          if (v.images.length > 0) {
            mainImage = v.images.find((img: any) => img?.is_main === true) || v.images[0];
          }
        } else if (typeof v.images === 'object' && (v.images as any).path) {
          // Nếu là object đơn
          mainImage = v.images as any;
        }
      }

      // Tạo imageUrl
      let imageUrl = 'https://via.placeholder.com/400x300?text=No+Image';

      if (mainImage?.path) {
        try {
          const { data: urlData } = this.supabase.storage
            .from('Vehicle')
            .getPublicUrl(mainImage.path);

          imageUrl = urlData.publicUrl;
          console.log(`[VehicleService] ✅ Vehicle ${v.id} image URL:`, imageUrl);
        } catch (err) {
          console.error(`[VehicleService] ❌ Error getting URL for vehicle ${v.id}:`, err);
        }
      } else {
        console.warn(`[VehicleService] ⚠️ Vehicle ${v.id} has no valid image`);
      }

      return {
        id: v.id,
        name: v.name,
        status: v.status || 'còn hàng',
        imageUrl,
      };
    });

    console.log('[VehicleService] ✅ Processed', vehiclesWithUrl.length, 'vehicles successfully');

    return {
      data: vehiclesWithUrl,
      nextCursor,
    };
  }

  async findOne(id: number) {
    const { data, error } = await this.supabase
      .schema('product')
      .from('vehicle')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(dto: VehicleCreateDto, images: Express.Multer.File[]) {
    console.log('[VehicleService] Creating new vehicle...');
    console.log('[VehicleService] Full DTO received:', dto);

    const { images: _, benefits, features, ...vehicleData } = dto;
    //

    console.log('[VehicleService] Data to insert into vehicle table:', vehicleData);
    console.log('[VehicleService] Removed fields:', {
      imagesFromJson: _?.length,
      benefits: benefits?.length,
      features: features?.length,
    });

    // 2️⃣ Insert CHỈ vehicle data (không có images, benefits, features, id, price)
    const { data: vehicleRes, error: vehicleErr } = await this.supabase
      .schema('product')
      .from('vehicle')
      .insert(vehicleData) // ← CHỈ: name, status, year, fuel_type, etc.
      .select()
      .single();

    if (vehicleErr) {
      console.error('[VehicleService] Insert vehicle error:', vehicleErr);
      throw new BadRequestException(vehicleErr.message);
    }

    const vehicleId = vehicleRes.id;
    console.log('[VehicleService] ✅ Vehicle created with ID:', vehicleId);

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

    console.log('[VehicleService] ✅ Vehicle created successfully with ID:', vehicleId);

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

    console.log('[VehicleService] ✅ Vehicle updated');

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

    console.log('[VehicleService] ✅ Vehicle updated successfully, ID:', id);

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
