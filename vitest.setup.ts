import { config } from 'dotenv'

config({ path: '.env.test' })

// Deterministic test master key (64 hex chars = 32 bytes)
// Only set if not already defined by .env.test
if (!process.env.ENCRYPTION_MASTER_KEY) {
  process.env.ENCRYPTION_MASTER_KEY = 'a'.repeat(64)
}
