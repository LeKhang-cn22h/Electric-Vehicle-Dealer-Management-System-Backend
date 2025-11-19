// export class CreateVehicleRequestDto {
//   dealer_id: string = '';
//   vehicle_id: string = '';
//   quantity: number = 0;
//   note?: string;
//   request_type: string = '';
// }
// DTO cho từng loại xe trong yêu cầu
export class VehicleItemDto {
  vehicle_id: string = '';

  quantity: number = 0;
  note?: string;
}

// DTO tổng cho một yêu cầu (từ một đại lý)
export class CreateVehicleRequestDto {
  dealer_id: string = '';
  dealer_name: string = '';
  request_type: string = '';
  vehicles!: VehicleItemDto[]; // MẢNG các xe trong một yêu cầu
}
