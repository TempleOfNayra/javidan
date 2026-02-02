/**
 * Check for ID overlap between security_forces and ir_agents tables
 */

import { sql } from '@/lib/db';

async function checkOverlap() {
  console.log('🔍 Checking for overlapping IDs between security_forces and ir_agents...\n');

  try {
    // Get all security forces with their names
    const forcesResult = await sql`
      SELECT id, full_name, full_name_en FROM security_forces ORDER BY id
    `;

    // Get all agents with their names
    const agentsResult = await sql`
      SELECT id, full_name, full_name_en FROM ir_agents ORDER BY id
    `;

    console.log('📊 Security Forces:');
    for (const force of forcesResult.rows) {
      console.log(`   ID ${force.id}: ${force.full_name || force.full_name_en || 'Unknown'}`);
    }

    console.log('\n📊 IR Agents:');
    for (const agent of agentsResult.rows) {
      console.log(`   ID ${agent.id}: ${agent.full_name || agent.full_name_en || 'Unknown'}`);
    }

    // Find overlaps
    const forceIds = new Set(forcesResult.rows.map((r: any) => r.id));
    const agentIds = new Set(agentsResult.rows.map((r: any) => r.id));

    const overlaps = Array.from(forceIds).filter(id => agentIds.has(id));

    console.log('\n' + '='.repeat(60));
    if (overlaps.length > 0) {
      console.log(`⚠️  Found ${overlaps.length} overlapping ID(s): ${overlaps.join(', ')}`);
      console.log('\nThese IDs exist in BOTH tables. This might be:');
      console.log('  1. Test data submitted to both forms');
      console.log('  2. ID sequence collision');
      console.log('  3. The same person exists as both agent and force');
    } else {
      console.log('✅ No overlapping IDs found');
    }
    console.log('='.repeat(60));

    // Check for media with ir_agent_id matching force IDs
    console.log('\n🔍 Checking media table for force-related uploads...\n');

    for (const forceId of Array.from(forceIds)) {
      const mediaCheck = await sql`
        SELECT id, file_name, type, is_primary, ir_agent_id, security_force_id
        FROM media
        WHERE ir_agent_id = ${forceId} OR security_force_id = ${forceId}
      `;

      if (mediaCheck.rows.length > 0) {
        const force = forcesResult.rows.find((f: any) => f.id === forceId);
        console.log(`📦 Media for Force ID ${forceId} (${force?.full_name || force?.full_name_en || 'Unknown'}):`);

        for (const media of mediaCheck.rows) {
          const location = media.ir_agent_id ? 'ir_agents' : media.security_force_id ? 'security_forces' : 'unknown';
          console.log(`   - ${media.file_name} → linked to ${location} (${media.type})${media.is_primary ? ' [PRIMARY]' : ''}`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the check
checkOverlap()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
