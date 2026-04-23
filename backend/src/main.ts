import './suppress-http2-warning';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend (http and https for dev with ssl)
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://localhost:4200',
      'http://127.0.0.1:4200',
      'https://192.168.50.204:4200',
      'https://127.0.0.1:4200',
      'https://restaurant-app-kohl-pi.vercel.app',
      'https://restaurant-kocbw6s8t-ilse-van-zyls-projects.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));
  
  // Swagger documentation (cast app to avoid duplicate @nestjs/common types in workspace)
  const config = new DocumentBuilder()
    .setTitle('Restaurant App API')
    .setDescription('API for Restaurant PWA App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api', app as any, document);
  
  const port = Number(process.env.PORT || 3000);
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`🚀 Server running on http://${host}:${port}`);
  console.log(`📚 API Documentation: http://${host}:${port}/api`);
}
bootstrap();
