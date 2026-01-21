import { createPool } from '@vercel/postgres';

// Environment variable prefix (shared database)
const ENV_PREFIX = 'javidanaman_';

// Build prefixed environment variable names
const getEnvVar = (name: string) => {
  const prefixedKey = `${ENV_PREFIX}${name}`;
  const prefixedValue = process.env[prefixedKey];
  const unprefixedValue = process.env[name];

  // Debug logging
  console.log(`[DB] Looking for env var: ${name}`);
  console.log(`[DB] Prefixed key (${prefixedKey}): ${prefixedValue ? 'EXISTS' : 'NOT FOUND'}`);
  console.log(`[DB] Unprefixed key (${name}): ${unprefixedValue ? 'EXISTS' : 'NOT FOUND'}`);

  return prefixedValue || unprefixedValue || '';
};

const connectionString = getEnvVar('POSTGRES_URL');
console.log(`[DB] Final connection string: ${connectionString ? 'EXISTS (length: ' + connectionString.length + ')' : 'NOT FOUND'}`);

// Only create pool if connection string is available
const pool = connectionString ? createPool({
  connectionString,
}) : null;

export const sql = pool?.sql || (() => {
  throw new Error('Database not configured. Please set POSTGRES_URL environment variable.');
}) as any;

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
