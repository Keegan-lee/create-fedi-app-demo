import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
export const env = createEnv({
  server: { NODE_ENV: z.enum(['development', 'production', 'test']) },
  client: { NEXT_PUBLIC_APP_NAME: z.string().default('My Fedi App') },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
});
