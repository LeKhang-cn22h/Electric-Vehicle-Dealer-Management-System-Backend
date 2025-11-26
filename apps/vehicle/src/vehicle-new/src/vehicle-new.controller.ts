import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
  UploadedFiles,
  UseInterceptors,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Patch,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { vehicleNewService } from './vehicle-new.service';
import { VehicleCompareDto } from './DTO/vehicle_compare.dto';
import { FilterVehicleUnitsDto } from './DTO/vehicle-unit.dto';

@Controller('vehicle')
export class vehicleNewController {
  constructor(private readonly vehicleService: vehicleNewService) {}

  @Get(':id/similar')
  getSimilar(@Param('id') id: number) {
    return this.vehicleService.getSimilarVehicles(id);
  }

  @Get('new-arrivals')
  getNewArrivals(@Query('limit', new DefaultValuePipe(8), ParseIntPipe) limit: number) {
    console.log('Vehicle Service: new-arrivals limit =', limit);
    return this.vehicleService.getNewArrivals(limit);
  }
  @Get()
  async findAll(
    @Query('keyword') keyword?: string,
    @Query('model') model?: string,
    @Query('status') status?: string,

    @Query('cursor') cursor?: number,
    @Query('limit') limit = 20,
  ) {
    return this.vehicleService.findAll({
      keyword,
      model,
      status,
      cursor: cursor ? Number(cursor) : undefined,
      limit: Number(limit),
    });
  }

  @Get('search')
  async searchAll(
    @Query('keyword') keyword: string,
    @Query('cursor') cursor?: number,
    @Query('limit') limit = 20,
  ) {
    return this.vehicleService.searchAll(keyword, cursor, limit);
  }

  @Get('filter/model')
  async filterByModel(
    @Query('model') model: string,
    @Query('cursor') cursor?: number,
    @Query('limit') limit = 20,
  ) {
    return this.vehicleService.filterByModel(model, cursor, limit);
  }

  @Get('models')
  async getAllModels() {
    return this.vehicleService.getAllModels();
  }

  @Get('noPrice')
  async getListVehicleWithNoPrice() {
    return this.vehicleService.getListVehicleWithNoPrice();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.getVehicleWithPrice(vehicleId);
  }

  @Post('list')
  async findList(@Body('vehicleIds') vehicleIds: number[]) {
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      throw new Error('vehicleIds phải là mảng và không được để trống');
    }

    const result = await this.vehicleService.getListVehicleWithListPrice(vehicleIds);
    return {
      success: true,
      data: result,
    };
  }

  // -------------------------------
  // CREATE VEHICLE — MULTIPART FORM
  // -------------------------------
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Req() req,
    @UploadedFiles() images: Express.Multer.File[],
    @Body('vehicle') vehicleJson: string,
  ) {
    if (!vehicleJson) {
      throw new BadRequestException('Missing vehicle JSON');
    }

    let vehicleData;
    try {
      vehicleData = JSON.parse(vehicleJson);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in vehicle field ');
    }

    console.log('[VehicleService] Received request:', {
      imagesCount: images?.length ?? 0,
      vehicleData,
    });

    return this.vehicleService.create(vehicleData, images);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @UploadedFiles() images: Express.Multer.File[],
    @Body('vehicle') vehicleJson: string,
  ) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }

    if (!vehicleJson) {
      throw new BadRequestException('Missing vehicle JSON');
    }

    let vehicleData;
    try {
      vehicleData = JSON.parse(vehicleJson);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in vehicle field');
    }

    console.log('[VehicleService] Update request: ', {
      vehicleId,
      imagesCount: images?.length ?? 0,
      vehicleData,
    });

    return this.vehicleService.update(vehicleId, vehicleData, images);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const vehicleId = Number(id);
    if (isNaN(vehicleId)) {
      throw new BadRequestException('Invalid vehicle ID');
    }
    return this.vehicleService.remove(vehicleId);
  }
  @Post('compare')
  async compareVehicles(@Body() compareDto: VehicleCompareDto) {
    console.log('Endpoint so sánh xe được gọi với dữ liệu:', compareDto);
    return this.vehicleService.compareVehicles(compareDto.vehicleIds);
  }

  // ===============================
  // VEHICLE UNIT MANAGEMENT
  // ===============================

  // Tạo vehicle unit
  @Post('units')
  async createVehicleUnit(@Body() dto: any) {
    return this.vehicleService.createVehicleUnit(dto);
  }

  // Lấy tất cả units (có filter)
  @Get('units')
  async getAllVehicleUnits(
    @Query() query: FilterVehicleUnitsDto, // Dùng DTO trực tiếp
  ) {
    console.log('=== RAW QUERY RECEIVED ===');
    console.log(JSON.stringify(query, null, 2));

    return this.vehicleService.getAllVehicleUnits(query);
  }
  @Get('units/group/:id')
  async getGroupUnits(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.getGroupUnit(id);
  }
  // Lấy một unit theo VIN
  @Get('units/vin/:vin')
  async getUnitByVIN(@Param('vin') vin: string) {
    return this.vehicleService.getVehicleUnitByVIN(vin);
  }

  // Update unit
  @Put('units/:id')
  async updateUnit(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.vehicleService.updateVehicleUnit(id, dto);
  }

  // Xoá unit
  @Delete('units/:id')
  async deleteUnit(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.deleteVehicleUnit(id);
  }

  // Đếm số lượng xe chưa điều phối theo vehicleId
  @Get('units/count/undeployed/:vehicleId')
  async countUndeployed(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.vehicleService.countUndeployedUnits(vehicleId);
  }

  // Đếm số lượng xe chưa được phân kho (available)
  @Get('units/count/unallocated/:vehicleId')
  async countUnallocated(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.vehicleService.countUnallocatedUnitsByVehicle(vehicleId);
  }

  // Điều phối 1 xe xuống kho
  @Patch('units/deploy/single')
  async deploySingle(
    @Body('unit_id', ParseIntPipe) unitId: number,
    @Body('warehouse_id', ParseIntPipe) warehouseId: number,
  ) {
    return this.vehicleService.deployUnitToWarehouse(unitId, warehouseId);
  }

  // Điều phối nhiều xe theo số lượng
  @Patch('units/deploy/multiple')
  async deployMultiple(@Body() dto: any) {
    // dto = { vehicle_id, warehouse_id, quantity }
    return this.vehicleService.deployMultipleUnitsToWarehouse(dto);
  }

  // Điều phối theo danh sách ID
  @Patch('units/deploy/batch')
  async deployBatch(@Body() dto: any) {
    // dto = { vehicle_unit_ids: number[], warehouse_id }
    return this.vehicleService.deployUnitsToWarehouse(dto);
  }

  // Thanh toán xe bằng VIN
  @Patch('units/pay')
  async payVehicle(@Body('vin') vin: string) {
    return this.vehicleService.payVehicle({ vin });
  }

  // Lấy danh sách xe available theo vehicleId (+ optional warehouse)
  @Get('units/available/:vehicleId')
  async getAvailableUnits(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Query('warehouse_id') warehouse_id?: number,
  ) {
    return this.vehicleService.getAvailableUnitsByVehicle(
      vehicleId,
      warehouse_id ? Number(warehouse_id) : undefined,
    );
  }
  // Lấy một unit theo ID
  @Get('units/:id')
  async getUnitById(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.getVehicleUnitById(id);
  }
}
