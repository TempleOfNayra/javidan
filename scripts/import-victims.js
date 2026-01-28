const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function submitVictim(victimData) {
  const formData = new FormData();

  // Add all victim data to form
  Object.entries(victimData).forEach(([key, value]) => {
    if (value) {
      formData.append(key, value.toString());
    }
  });

  try {
    const response = await fetch(`${API_URL}/api/submit`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to submit ${victimData.firstNameEn} ${victimData.lastNameEn}: ${error.message}`);
  }
}

async function importVictims() {
  const victimsPath = path.join(__dirname, '..', 'victim-data.json');
  const victims = JSON.parse(fs.readFileSync(victimsPath, 'utf8'));

  console.log(`Importing ${victims.length} victims...`);

  let successCount = 0;
  let failCount = 0;

  for (const victim of victims) {
    try {
      const result = await submitVictim(victim);
      console.log(`✓ Imported: ${victim.firstNameEn} ${victim.lastNameEn} (ID: ${result.recordId})`);
      successCount++;

      // Wait a bit between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${victims.length}`);
}

importVictims().catch(console.error);
