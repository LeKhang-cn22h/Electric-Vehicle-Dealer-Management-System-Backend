import { createProductServiceClient } from './src/clients/product.client';

async function test() {
  const client = createProductServiceClient();

  const products = await client.send({ cmd: 'get_products' }, {}).toPromise();
  console.log('All products:', products);

  const product = await client.send({ cmd: 'get_product_by_id' }, 1).toPromise();
  console.log('Product 1:', product);
}

test();
