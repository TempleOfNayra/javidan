/**
 * Migration Script: Move media from ir_agents to security_forces
 *
 * This script finds media records that have ir_agent_id set where the ID
 * corresponds to a security_force, and updates them to use security_force_id instead.
 *
 * SAFETY: This script only UPDATES existing records, it does NOT delete anything.
 */

import { sql } from '@/lib/db';

async function migrateForceMedia() {
  console.log('🔍 Starting migration: Moving incorrectly stored force media...\n');

  try {
    // Find all security force IDs
    const forcesResult = await sql`
      SELECT id FROM security_forces ORDER BY id
    `;

    const forceIds = forcesResult.rows.map((row: any) => row.id);
    console.log(`📊 Found ${forceIds.length} security forces in database\n`);

    if (forceIds.length === 0) {
      console.log('✅ No security forces found. Nothing to migrate.');
      return;
    }

    let totalMigrated = 0;

    // For each force ID, check if there are media records with ir_agent_id = force.id
    for (const forceId of forceIds) {
      // Check if this force ID exists in ir_agents (it shouldn't)
      const agentCheck = await sql`
        SELECT id FROM ir_agents WHERE id = ${forceId}
      `;

      const isActualAgent = agentCheck.rows.length > 0;

      if (isActualAgent) {
        console.log(`⚠️  Skipping ID ${forceId} - exists in both security_forces AND ir_agents (manual review needed)`);
        continue;
      }

      // Find media with ir_agent_id = this force's ID
      const mediaToMigrate = await sql`
        SELECT id, file_name, type, is_primary
        FROM media
        WHERE ir_agent_id = ${forceId}
      `;

      if (mediaToMigrate.rows.length > 0) {
        console.log(`📦 Found ${mediaToMigrate.rows.length} media record(s) for security force ID ${forceId}:`);

        for (const media of mediaToMigrate.rows) {
          console.log(`   - ${media.file_name} (${media.type})${media.is_primary ? ' [PRIMARY]' : ''}`);
        }

        // Update these media records to use security_force_id instead
        const updateResult = await sql`
          UPDATE media
          SET
            security_force_id = ${forceId},
            ir_agent_id = NULL
          WHERE ir_agent_id = ${forceId}
        `;

        console.log(`✅ Migrated ${mediaToMigrate.rows.length} media record(s) for force ID ${forceId}\n`);
        totalMigrated += mediaToMigrate.rows.length;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Migration complete! Total media records migrated: ${totalMigrated}`);
    console.log('='.repeat(60));

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
