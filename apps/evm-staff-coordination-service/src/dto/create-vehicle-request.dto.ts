// export class CreateVehicleRequestDto {
//   dealer_id: string = '';
//   vehicle_id: string = '';
//   quantity: number = 0;
//   note?: string;
//   request_type: string = '';
// }
// DTO cho từng loại xe trong yêu cầu

// DTO tổng cho một yêu cầu (từ một đại lý)
export class CreateVehicleRequestDto {
  dealer_name: string = '';
  email: string = '';
  address: string = '';
  quantity: number = 0;
  status: string = 'pending';
}
