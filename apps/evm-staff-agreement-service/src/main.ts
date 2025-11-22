import { NestFactory } from '@nestjs/core';
import { EvmStaffAgreementModule } from './evm-staff-agreement-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EvmStaffAgreementModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3004);
  console.log(`🚀 EVM Staff Agreement Service is running on port ${process.env.PORT || 3004}`);
}
bootstrap();
// import { NestFactory } from '@nestjs/core';
// import { EvmAgreementModule } from './evm-staff-agreement-service.module';

// async function bootstrap() {
//   const app = await NestFactory.create(EvmAgreementModule);

//   // Listen on all network interfaces → FIX lỗi ECONNREFUSED (::1)
//   await app.listen(process.env.PORT ? Number(process.env.PORT) : 3004);

//   console.log(`🚀 EVM Agreement Service running on port ${process.env.PORT || 3004}`);

//   // Log routes để debug
//   const server = app.getHttpAdapter().getInstance();
//   if (server && server._router) {
//     console.log('📋 Registered routes:');
//     server._router.stack.forEach((layer: any) => {
//       if (layer.route) {
//         const method = Object.keys(layer.route.methods)[0]?.toUpperCase();
//         const path = layer.route.path;
//         console.log(`${method} ${path}`);
//       }
//     });
//   }
// }

// bootstrap();
