import { IsArray, IsNotEmpty, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class VehicleCompareDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Cần ít nhất 2 xe để so sánh' })
  @ArrayMaxSize(4, { message: 'Chỉ có thể so sánh tối đa 4 xe' })
  @IsNotEmpty({ each: true, message: 'ID xe không được để trống' })
  vehicleIds: number[];
}
