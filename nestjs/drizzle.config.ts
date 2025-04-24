import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load a specific .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// console.log(`Loaded .env file: ${path.resolve(__dirname, '../.env')}`);
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not defined');
}

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
