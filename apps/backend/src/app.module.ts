import { Module } from '@nestjs/common';
import { TrpcModule } from './trpc/trpc.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import * as path from 'path';

const requiredEnvVariables = ['PORT'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../../.env'),
      validate: (config: Record<string, any>) => {
        // Perform custom validation for required environment variables
        requiredEnvVariables.forEach((variable) => {
          if (!config[variable]) {
            throw new Error(`Environment variable ${variable} is missing!`);
          }
        });

        // Return the validated config object
        return config;
      },
    }),
    TrpcModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

console.log('dir', __dirname);
console.log('process.env.PORT', process.env.PORT);
