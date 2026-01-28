import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function fixNameConstraints() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('Database connection string not found');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('Removing NOT NULL constraints from name columns...\n');

    // Records table
    console.log('Processing records table...');
    await sql`ALTER TABLE records ALTER COLUMN first_name DROP NOT NULL`;
    await sql`ALTER TABLE records ALTER COLUMN last_name DROP NOT NULL`;
    console.log('✓ records table updated');

    // Security forces table
    console.log('Processing security_forces table...');
    await sql`ALTER TABLE security_forces ALTER COLUMN first_name DROP NOT NULL`;
    await sql`ALTER TABLE security_forces ALTER COLUMN last_name DROP NOT NULL`;
    console.log('✓ security_forces table updated');

    // IR agents table
    console.log('Processing ir_agents table...');
    await sql`ALTER TABLE ir_agents ALTER COLUMN first_name DROP NOT NULL`;
    await sql`ALTER TABLE ir_agents ALTER COLUMN last_name DROP NOT NULL`;
    console.log('✓ ir_agents table updated');

    console.log('\n✅ All constraints removed successfully!');
    console.log('Now you can submit records with either Farsi OR English names.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixNameConstraints();
