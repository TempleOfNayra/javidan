import { neon } from '@neondatabase/serverless';

// Lazy connection initialization
let sqlClient: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!sqlClient) {
    // Get connection string with optional prefix support
    const DB_PREFIX = process.env.DB_PREFIX || '';
    let connectionString = process.env.POSTGRES_URL;

    if (DB_PREFIX && !connectionString) {
      connectionString = process.env[`${DB_PREFIX}POSTGRES_URL`];
    }

    if (!connectionString) {
      throw new Error(`POSTGRES_URL not found. Check ${DB_PREFIX ? `DB_PREFIX (${DB_PREFIX})` : 'environment variables'}.`);
    }

    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

// Wrap to match @vercel/postgres API (returns {rows} format)
export const sql = async (strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: any[] }> => {
  const client = getConnection();
  const rows = await client(strings, ...values);
  return { rows: rows as any[] };
};

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
