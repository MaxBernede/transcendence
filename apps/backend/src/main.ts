import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import  cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //   / allow cors http://localhost:3001
  //   app.enableCors({
  //     origin: 'http://localhost:3001', // Allow requests from your frontend's port
  //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //     allowedHeaders: 'Content-Type, Accept, authorization',
  //     credentials: true,
  //   });

  app.use(cookieParser());

  console.log('process.env.PORT', process.env.PORT);
  await app.listen(process.env.PORT);
}
bootstrap();
