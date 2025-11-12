// export class CreateVehicleRequestDto {
//   dealer_id: string = '';
//   vehicle_id: string = '';
//   quantity: number = 0;
//   note?: string;
//   request_type: string = '';
// }
export class CreateVehicleRequestDto {
  dealer_name: string = '';
  vehicle_model: string = '';
  quantity: number = 0;
  note?: string;
  request_type: string = '';
}

export class VehicleRequestDto extends CreateVehicleRequestDto {
  id: string = '';
  status: string = 'pending';
  created_at: string = '';
  updated_at: string = '';
  created_by?: string;
}
