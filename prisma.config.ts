import { defineConfig } from 'prisma/config'
import { existsSync } from 'fs'

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
