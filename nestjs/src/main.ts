import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import {  } from 'swagger-ui-themes/themes/3.x/theme-feeling-blue.css';

import * as fs from 'fs';

import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    // customCss: theme.getBuffer(SwaggerThemeNameEnum.DRACULA),
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
  };
  SwaggerModule.setup('docs', app, document, options);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
      // forbidNonWhitelisted: true,
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
        sameSite: 'Strict', // Or 'None' if cross-origin is required
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
    }
    next();
  });

  // Ensure the "uploads/avatars" folder exists

  const uploadPath = join(__dirname, '..', 'uploads', 'avatars');
  console.log(`Checking directory: ${uploadPath}`);
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
    console.log(`Created directory: ${uploadPath}`);
  } else {
    console.log(`Directory already exists: ${uploadPath}`);
  }

  // Serve static files for uploaded avatars
  //   app.useStaticAssets(uploadPath, {
  //     prefix: '/uploads/avatars/',
  //   });

  // app.use('/uploads', express.static(uploadPath));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  const publicAssetsPath = join(
    __dirname,
    '..',
    '..',
    'frontend',
    'public',
    'assets',
  );
  console.log(`Serving static public assets from: ${publicAssetsPath}`);
  app.use('/assets', express.static(publicAssetsPath));

  console.log(`Static assets served from: ${uploadPath}`);
  console.log(
    `Static public assets served from: ${join(__dirname, '..', 'frontend', 'public', 'assets')}`,
  );

  // Enable CORS for frontend communication
//   app.enableCors({
//     origin: 'http://localhost:3001', // Allow requests from your frontend's port
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     allowedHeaders: 'Content-Type, Accept, Authorization',
//     credentials: true,
//   });
app.enableCors({
	origin: function (origin, callback) {
	  const allowedOrigins = [
		'http://localhost:3001', // Frontend 1
		'http://localhost:3002', // Frontend 2
		// Add more origins if needed
	  ];
  
	  if (allowedOrigins.includes(origin) || !origin) {
		// Allow requests from the allowed origins or no origin (for non-browser clients)
		callback(null, true);
	  } else {
		// Reject the request if the origin is not allowed
		callback(new Error('Not allowed by CORS'), false);
	  }
	},
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
	allowedHeaders: 'Content-Type, Accept, Authorization',
	credentials: true,
  });
//   console.log('CORS enabled for origin:', 'http://localhost:3001');

  // Log server listening port
  const port = 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
