import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function addFullNameColumns() {
  const connectionString = process.env.javidanaaman_POSTGRES_URL;

  if (!connectionString) {
    console.error('Database connection string not found');
    process.exit(1);
  }

  const sql = neon(connectionString);

  try {
    console.log('Adding full_name and full_name_en columns to tables...');

    // Add columns to records table
    console.log('Processing records table...');
    await sql`ALTER TABLE records ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`;
    await sql`ALTER TABLE records ADD COLUMN IF NOT EXISTS full_name_en VARCHAR(255)`;
    console.log('✓ records table updated');

    // Add columns to security_forces table
    console.log('Processing security_forces table...');
    await sql`ALTER TABLE security_forces ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`;
    await sql`ALTER TABLE security_forces ADD COLUMN IF NOT EXISTS full_name_en VARCHAR(255)`;
    console.log('✓ security_forces table updated');

    // Add columns to ir_agents table
    console.log('Processing ir_agents table...');
    await sql`ALTER TABLE ir_agents ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`;
    await sql`ALTER TABLE ir_agents ADD COLUMN IF NOT EXISTS full_name_en VARCHAR(255)`;
    console.log('✓ ir_agents table updated');

    // Populate full_name from first_name + last_name for existing records
    console.log('\nPopulating full_name fields from existing data...');

    await sql`
      UPDATE records
      SET full_name = CONCAT(first_name, ' ', last_name)
      WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL
    `;

    await sql`
      UPDATE records
      SET full_name_en = CONCAT(first_name_en, ' ', last_name_en)
      WHERE full_name_en IS NULL AND first_name_en IS NOT NULL AND last_name_en IS NOT NULL
    `;

    await sql`
      UPDATE security_forces
      SET full_name = CONCAT(first_name, ' ', last_name)
      WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL
    `;

    await sql`
      UPDATE security_forces
      SET full_name_en = CONCAT(first_name_en, ' ', last_name_en)
      WHERE full_name_en IS NULL AND first_name_en IS NOT NULL AND last_name_en IS NOT NULL
    `;

    await sql`
      UPDATE ir_agents
      SET full_name = CONCAT(first_name, ' ', last_name)
      WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL
    `;

    await sql`
      UPDATE ir_agents
      SET full_name_en = CONCAT(first_name_en, ' ', last_name_en)
      WHERE full_name_en IS NULL AND first_name_en IS NOT NULL AND last_name_en IS NOT NULL
    `;

    console.log('✓ Existing data migrated');

    console.log('\n✅ All done! Columns added and data migrated successfully.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addFullNameColumns();
