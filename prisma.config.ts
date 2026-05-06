import { defineConfig } from 'prisma/config';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Charge .env depuis apps/backend
dotenv.config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
