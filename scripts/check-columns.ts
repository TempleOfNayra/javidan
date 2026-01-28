import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function checkColumns() {
  const connectionString = process.env.javidanaaman_POSTGRES_URL;

  if (!connectionString) {
    console.error('Database connection string not found');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('Checking column existence in database tables...\n');

    // Check records table
    console.log('=== RECORDS TABLE ===');
    const recordsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'records' AND column_name IN ('full_name', 'full_name_en', 'first_name', 'last_name')
      ORDER BY column_name
    `;
    console.log('Columns found:', recordsColumns);

    // Check security_forces table
    console.log('\n=== SECURITY_FORCES TABLE ===');
    const forcesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'security_forces' AND column_name IN ('full_name', 'full_name_en', 'first_name', 'last_name')
      ORDER BY column_name
    `;
    console.log('Columns found:', forcesColumns);

    // Check ir_agents table
    console.log('\n=== IR_AGENTS TABLE ===');
    const agentsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ir_agents' AND column_name IN ('full_name', 'full_name_en', 'first_name', 'last_name')
      ORDER BY column_name
    `;
    console.log('Columns found:', agentsColumns);

    console.log('\n✅ Column check complete');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkColumns();
