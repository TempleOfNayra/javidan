/**
 * ROLLBACK Script: Move media back from security_force_id to ir_agent_id
 *
 * This reverses the migration that moved force media incorrectly.
 * It moves media back to ir_agent_id where they were originally.
 *
 * SAFETY: Only UPDATES media records, does NOT delete anything.
 */

import { sql } from '@/lib/db';

async function rollbackForceMedia() {
  console.log('🔄 Starting ROLLBACK: Moving media back to ir_agent_id...\n');

  try {
    // These are the specific force IDs we migrated: 1, 2, 3, 4
    const forceIdsToRollback = [1, 2, 3, 4];

    let totalRolledBack = 0;

    for (const forceId of forceIdsToRollback) {
      // Find media that currently has security_force_id = forceId
      const mediaToRollback = await sql`
        SELECT id, file_name, type, is_primary
        FROM media
        WHERE security_force_id = ${forceId}
        AND ir_agent_id IS NULL
      `;

      if (mediaToRollback.rows.length > 0) {
        console.log(`📦 Rolling back Force ID ${forceId}:`);
        console.log(`   Found ${mediaToRollback.rows.length} media record(s) to move back:`);

        for (const media of mediaToRollback.rows) {
          console.log(`   - ${media.file_name} (${media.type})${media.is_primary ? ' [PRIMARY]' : ''}`);
        }

        // Move these media records back from security_force_id to ir_agent_id
        const rollbackResult = await sql`
          UPDATE media
          SET
            ir_agent_id = ${forceId},
            security_force_id = NULL
          WHERE security_force_id = ${forceId}
          AND ir_agent_id IS NULL
        `;

        console.log(`✅ Rolled back ${mediaToRollback.rows.length} record(s)\n`);
        totalRolledBack += mediaToRollback.rows.length;
      }
    }

    console.log('='.repeat(60));
    console.log(`✨ Rollback complete! Total media records rolled back: ${totalRolledBack}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  The media is now back to where it was before the migration.');
    console.log('   Security forces will NOT show profile pictures until correctly uploaded.');

  } catch (error) {
    console.error('❌ Rollback error:', error);
    throw error;
  }
}

// Run the rollback
rollbackForceMedia()
  .then(() => {
    console.log('\n✅ Rollback script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Rollback script failed:', error);
    process.exit(1);
  });
