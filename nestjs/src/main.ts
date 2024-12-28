import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe());

  // Use cookie-parser for handling cookies
  app.use(cookieParser());

  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
  });

  // Ensure the "uploads/avatars" folder exists
  const uploadPath = join(__dirname, '..', 'uploads', 'avatars'); // Adjusted path
  console.log(`Checking directory: ${uploadPath}`);
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
    console.log(`Created directory: ${uploadPath}`);
  } else {
    console.log(`Directory already exists: ${uploadPath}`);
  }

  // Serve static files for uploaded avatars
  app.useStaticAssets(uploadPath, {
    prefix: '/uploads/avatars/',
  });
  console.log(`Static assets served from: ${uploadPath}`);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:3001', // Allow requests from your frontend's port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  console.log('CORS enabled for origin:', 'http://localhost:3001');

  // Log server listening port
  const port = 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
