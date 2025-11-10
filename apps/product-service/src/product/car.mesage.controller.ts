import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductService } from './car.service';

@Controller()
export class ProductMessageController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern({ cmd: 'get_products' })
  findAllProducts() {
    return this.productService.findAll();
  }

  @MessagePattern({ cmd: 'get_product_by_id' })
  findOneProduct(id: number) {
    return this.productService.findOne(id);
  }

  @MessagePattern({ cmd: 'create_product' })
  createProduct(data: any) {
    return this.productService.create(data);
  }
}
