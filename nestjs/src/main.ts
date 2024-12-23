import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
  });

  // Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:3001', // Allow requests from your frontend's port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, authorization',
    credentials: true,
  });

  // Enable validation globally with whitelist option
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip out properties not decorated with @Is* decorators
    }),
  );

  // Log server listening port
  const port = 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}

bootstrap();
