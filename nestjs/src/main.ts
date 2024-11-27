import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth/auth.guard';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: 'http://localhost:3001', // Allow requests from your frontend's port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Specify allowed methods
    allowedHeaders: 'Content-Type, Accept', // Specify allowed headers
    credentials: true, // Allow credentials (optional, if needed)
  });

  // Apply the AuthGuard globally
	const reflector = app.get(Reflector);
	const jwtService = app.get(JwtService);
	app.useGlobalGuards(new AuthGuard(jwtService, reflector));

  await app.listen(3000);

}
bootstrap();
