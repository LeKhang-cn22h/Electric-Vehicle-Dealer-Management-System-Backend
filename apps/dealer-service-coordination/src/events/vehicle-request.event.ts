export class VehicleRequestEvent {
  constructor(
    public readonly dealerId: string,
    public readonly vehicleType: string,
    public readonly quantity: number,
  ) {}
}
