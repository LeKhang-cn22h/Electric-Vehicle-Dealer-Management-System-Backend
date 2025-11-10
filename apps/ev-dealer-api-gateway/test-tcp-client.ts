import { ClientProxyFactory, Transport } from '@nestjs/microservices';

async function test() {
  // Tạo client TCP kết nối tới Gateway TCP
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1', // địa chỉ Gateway
      port: 4001, // port TCP Gateway
    },
  });

  // Gửi message theo pattern NestJS
  const result = await client.send({ cmd: 'get_products' }, {}).toPromise();
  console.log('Kết quả từ Gateway:', result);
}

test();
