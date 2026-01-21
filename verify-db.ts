import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sql } from './lib/db';

async function verifyDatabase() {
  try {
    console.log('\n🔍 Verifying database connection and records...\n');

    // Count total records
    const countResult = await sql`SELECT COUNT(*) as count FROM records`;
    const totalRecords = parseInt(countResult.rows[0].count);
    console.log(`✅ Total records in database: ${totalRecords}`);

    // Get last 5 records
    if (totalRecords > 0) {
      const records = await sql`
        SELECT id, first_name, last_name, location, birth_year, submitted_at
        FROM records
        ORDER BY submitted_at DESC
        LIMIT 5
      `;

      console.log('\n📋 Last 5 records:');
      records.rows.forEach((record: any, index: number) => {
        console.log(`\n${index + 1}. Record ID: ${record.id}`);
        console.log(`   Name: ${record.first_name} ${record.last_name}`);
        console.log(`   Location: ${record.location}`);
        console.log(`   Birth Year: ${record.birth_year || 'N/A'}`);
        console.log(`   Submitted: ${record.submitted_at.toISOString()}`);
      });
    }

    console.log('\n✅ Database verification complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();
