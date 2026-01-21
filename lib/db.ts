// Environment variable prefix (shared database)
const ENV_PREFIX = 'javidanaman_';

// CRITICAL: Set unprefixed env var from prefixed one BEFORE any imports
const prefixedValue = process.env[`${ENV_PREFIX}POSTGRES_URL`];
const prefixedPrismaValue = process.env[`${ENV_PREFIX}POSTGRES_PRISMA_URL`];
const prefixedNonPoolingValue = process.env[`${ENV_PREFIX}POSTGRES_URL_NON_POOLING`];

if (prefixedValue && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = prefixedValue;
  console.log(`[DB] Copied javidanaman_POSTGRES_URL to POSTGRES_URL`);
}
if (prefixedPrismaValue && !process.env.POSTGRES_PRISMA_URL) {
  process.env.POSTGRES_PRISMA_URL = prefixedPrismaValue;
}
if (prefixedNonPoolingValue && !process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL_NON_POOLING = prefixedNonPoolingValue;
}

// Now import @vercel/postgres
import { sql } from '@vercel/postgres';

export { sql };

// Initialize database tables
export async function initDatabase() {
  try {
    // Create records table
    await sql`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        birth_year INTEGER,
        national_id VARCHAR(255),
        father_name VARCHAR(255),
        mother_name VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        verification_level VARCHAR(50) DEFAULT 'unverified',
        evidence_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create media table
    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES records(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        r2_key VARCHAR(500) NOT NULL,
        public_url TEXT NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for better search performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_location ON records(location)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_names ON records(first_name, last_name)
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't throw - let the app continue even if tables already exist
  }
}
