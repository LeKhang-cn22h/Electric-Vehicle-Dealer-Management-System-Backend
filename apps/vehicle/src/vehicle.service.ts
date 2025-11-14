import { Injectable } from '@nestjs/common';
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
    // Query vehicle + ảnh chính
    let req = this.supabase
      .schema('product')
      .from('vehicle')
      .select(
        `
      id,
      name,
      images!inner(path, is_main)
    `,
      )
      .eq('images.is_main', true)
      .order('id', { ascending: true })
      .limit(limit);

    // Cursor pagination
    if (cursor) {
      req = req.gt('id', cursor);
    }

    const { data, error } = await req;
    if (error) throw new Error(error.message);

    //  nextCursor
    const nextCursor = data.length > 0 ? data[data.length - 1].id : null;

    //  Convert path → public URL
    const vehiclesWithUrl = data.map((v) => {
      const { publicUrl } = this.supabase.storage.from('Vehicle').getPublicUrl(v.images.path);

      return {
        id: v.id,
        name: v.name,
        imageUrl: publicUrl,
      };
    });

    //
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

  async create(vehicle: VehicleCreateDto) {
    const { images, benefits, features, ...vehicleData } = vehicle;

    // 1️⃣ Insert vào bảng vehicle
    const { data: vehicleResult, error: vehicleError } = await this.supabase
      .schema('product')
      .from('vehicle')
      .insert(vehicleData)
      .select()
      .single();

    if (vehicleError) throw new Error(vehicleError.message);

    const vehicleId = vehicleResult.id;

    // 2️⃣ Upload và insert images
    if (images && images.length > 0) {
      for (const img of images) {
        // Upload file lên Storage
        const { error: uploadErr } = await this.supabase.storage
          .from('Vehicle')
          .upload(img.path, img.file);
        if (uploadErr) throw new Error(uploadErr.message);

        // Insert đường dẫn vào bảng images
        const { error: imgErr } = await this.supabase
          .schema('product')
          .from('images')
          .insert({
            car_id: vehicleId,
            path: img.path,
            is_main: img.is_main ?? false,
          });
        if (imgErr) throw new Error(imgErr.message);
      }
    }

    // 3️⃣ Insert benefits
    if (benefits && benefits.length > 0) {
      const beneToInsert = benefits.map((b) => ({
        car_id: vehicleId,
        benefit: b.benefit,
      }));

      const { error: beneErr } = await this.supabase
        .schema('product')
        .from('benefits')
        .insert(beneToInsert);

      if (beneErr) throw new Error(beneErr.message);
    }

    // 4️⃣ Insert features
    if (features && features.length > 0) {
      const featuresToInsert = features.map((f) => ({
        car_id: vehicleId,
        category: f.category,
        item: f.item,
      }));

      const { error: featureErr } = await this.supabase
        .schema('product')
        .from('features')
        .insert(featuresToInsert);

      if (featureErr) throw new Error(featureErr.message);
    }

    return { message: 'Created successfully', vehicleId };
  }

  async update(id: number, vehicle: VehicleUpdateDto) {
    const { images, benefits, features, ...vehicleData } = vehicle;

    // 1️⃣ Update bảng vehicle
    const { error: updateError } = await this.supabase
      .schema('product')
      .from('vehicle')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // 2️⃣ Update images
    if (images) {
      // Xoá toàn bộ image cũ trong DB
      await this.supabase.schema('product').from('images').delete().eq('car_id', id);

      // Upload ảnh mới và insert vào DB
      for (const img of images) {
        // Upload lên Storage
        const { error: uploadErr } = await this.supabase.storage
          .from('Vehicle')
          .upload(img.path, img.file); // img.file là Blob/Buffer
        if (uploadErr) throw new Error(uploadErr.message);

        // Insert vào DB
        const { error: imgErr } = await this.supabase
          .schema('product')
          .from('images')
          .insert({
            car_id: id,
            path: img.path,
            is_main: img.is_main ?? false,
          });
        if (imgErr) throw new Error(imgErr.message);
      }
    }

    // 3️⃣ Update benefits
    if (benefits) {
      await this.supabase.schema('product').from('benefits').delete().eq('car_id', id);

      const newBenefits = benefits.map((b) => ({
        car_id: id,
        benefit: b.benefit,
      }));

      const { error: beneErr } = await this.supabase
        .schema('product')
        .from('benefits')
        .insert(newBenefits);
      if (beneErr) throw new Error(beneErr.message);
    }

    // 4️⃣ Update features
    if (features) {
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
      if (featErr) throw new Error(featErr.message);
    }

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
