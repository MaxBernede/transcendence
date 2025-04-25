import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { PongGateway } from './game/pong.gateway';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Fetch ConfigService for debugging
  const configService = app.get(ConfigService);
  // console.log('INTRA_CLIENT_ID:', configService.get('INTRA_CLIENT_ID'));
  // console.log('INTRA_CLIENT_SECRET:', configService.get('INTRA_CLIENT_SECRET'));

  // Enable validation globally
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const theme = new SwaggerTheme();
  const options = {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
  };
  SwaggerModule.setup('docs', app, document, options);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Use cookie-parser for handling cookies
  app.use(cookieParser());

  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    const token = req.cookies?.jwt; // Retrieve JWT from cookies
    if (token) {
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        // sameSite: 'Strict', // Or 'None' if cross-origin is required
        sameSite: 'Lax', // Or 'None' if cross-origin is required
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
    }
    next();
  });

  // Ensure the "uploads/avatars" folder exists
  const uploadPath = join(__dirname, '..', 'uploads', 'avatars');
  // console.log(`Checking directory: ${uploadPath}`);
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
    // console.log(`Created directory: ${uploadPath}`);
  } else {
    // console.log(`Directory already exists: ${uploadPath}`);
  }

  // Serve static files for uploaded avatars
  //   app.useStaticAssets(uploadPath, {
  //     prefix: '/uploads/avatars/',
  //   });

  // app.use('/uploads', express.static(uploadPath));
  const uploadsPath = path.join(process.cwd(), 'uploads');
  // console.log('Serving static files from:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));

  const publicAssetsPath = join(
    __dirname,
    '..',
    '..',
    'frontend',
    'public',
    'assets',
  );
  // console.log(`Serving static public assets from: ${publicAssetsPath}`);
  app.use('/assets', express.static(publicAssetsPath));

  // console.log(`Static assets served from: ${uploadPath}`);
  // console.log(
  //   `Static public assets served from: ${join(__dirname, '..', 'frontend', 'public', 'assets')}`,
  // );

  //   Enable CORS for frontend communication
  app.enableCors({
    // origin: '*', // Allow requests from any origin (for testing purposes)
	origin: true, // Allow requests from any origin (for testing purposes)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Log server listening port
  app.useWebSocketAdapter(new IoAdapter(app));
  const pongGateway = app.get(PongGateway);
  // console.log('✅ WebSocket Gateway is Running:', pongGateway ? 'YES' : 'NO');

  const port = 3000;
  await app.listen(port);
}

bootstrap();
