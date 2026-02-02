/**
 * Migration Script v2: Move media from ir_agent_id to security_force_id
 *
 * This finds media records where ir_agent_id matches a security_force ID
 * and moves them to use security_force_id instead.
 *
 * SAFETY: Only UPDATES media records, does NOT delete anything.
 */

import { sql } from '@/lib/db';

async function migrateForceMedia() {
  console.log('🔍 Starting migration v2: Moving force media to correct foreign key...\n');

  try {
    // Find all security force IDs
    const forcesResult = await sql`
      SELECT id, full_name, full_name_en FROM security_forces ORDER BY id
    `;

    console.log(`📊 Found ${forcesResult.rows.length} security forces\n`);

    let totalMigrated = 0;

    for (const force of forcesResult.rows) {
      const forceId = force.id;
      const forceName = force.full_name || force.full_name_en || 'Unknown';

      // Find media with ir_agent_id = this force's ID
      const mediaToMigrate = await sql`
        SELECT id, file_name, type, is_primary
        FROM media
        WHERE ir_agent_id = ${forceId}
        AND security_force_id IS NULL
      `;

      if (mediaToMigrate.rows.length > 0) {
        console.log(`📦 Force ID ${forceId} (${forceName}):`);
        console.log(`   Found ${mediaToMigrate.rows.length} media record(s) with wrong foreign key:`);

        for (const media of mediaToMigrate.rows) {
          console.log(`   - ${media.file_name} (${media.type})${media.is_primary ? ' [PRIMARY]' : ''}`);
        }

        // Move these media records from ir_agent_id to security_force_id
        const updateResult = await sql`
          UPDATE media
          SET
            security_force_id = ${forceId},
            ir_agent_id = NULL
          WHERE ir_agent_id = ${forceId}
          AND security_force_id IS NULL
        `;

        console.log(`✅ Migrated ${mediaToMigrate.rows.length} record(s)\n`);
        totalMigrated += mediaToMigrate.rows.length;
      }
    }

    console.log('='.repeat(60));
    console.log(`✨ Migration complete! Total media records migrated: ${totalMigrated}`);
    console.log('='.repeat(60));

    if (totalMigrated > 0) {
      console.log('\n💡 The security force profile pictures should now be visible!');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run the migration
migrateForceMedia()
  .then(() => {
    console.log('\n✅ Migration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
