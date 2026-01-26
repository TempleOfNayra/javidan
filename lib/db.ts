import { neon } from '@neondatabase/serverless';
import { DATABASE_CONFIG } from './config';

// Lazy connection initialization
let sqlClient: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!sqlClient) {
    const varName = `${DATABASE_CONFIG.DB_PREFIX}POSTGRES_URL`;
    const connectionString = process.env[varName];

    if (!connectionString) {
      // Debug: log all available env vars that start with javidanaman
      const availableVars = Object.keys(process.env).filter(k => k.includes('javidan') || k.includes('POSTGRES'));
      console.error('Available env vars:', availableVars);
      console.error('Looking for:', varName);
      throw new Error(`Environment variable '${varName}' not found. Available: ${availableVars.join(', ')}`);
    }

    // Log which database we're connecting to (mask the password)
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log(`[DB] DB_PREFIX: "${DATABASE_CONFIG.DB_PREFIX}"`);
    console.log(`[DB] Looking for env var: ${varName}`);
    console.log(`[DB] Connecting to: ${maskedUrl}`);
    console.log(`[DB] Available POSTGRES vars:`, Object.keys(process.env).filter(k => k.includes('POSTGRES')));

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
