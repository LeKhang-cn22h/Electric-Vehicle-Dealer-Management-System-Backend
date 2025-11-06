export class CreateVehicleRequestDto {
  dealer_id: string = '';
  vehicle_id: string = '';
  quantity: number = 0;
  note?: string;
  request_type: string = '';
}
