import { defineConfig } from 'prisma/config'

process.loadEnvFile('.env.local')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
