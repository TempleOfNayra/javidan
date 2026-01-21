import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from '@/lib/db';

describe('Database Insert and Verify', () => {
  const testRecord = {
    firstName: 'Neda',
    lastName: 'Agha-Soltan',
    location: 'Tehran',
    birthYear: 1983,
    nationalId: 'TEST123456',
    fatherName: 'Test Father',
    motherName: 'Test Mother',
  };

  let insertedRecordId: number;

  beforeAll(async () => {
    // Initialize database tables
    await sql`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        birth_year INTEGER,
        national_id VARCHAR(255),
        father_name VARCHAR(255),
        mother_name VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        verification_level VARCHAR(50) DEFAULT 'unverified',
        evidence_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
  });

  it('should insert a record and leave it in the database for verification', async () => {
    const result = await sql`
      INSERT INTO records (
        first_name, last_name, location, birth_year, national_id,
        father_name, mother_name
      )
      VALUES (
        ${testRecord.firstName},
        ${testRecord.lastName},
        ${testRecord.location},
        ${testRecord.birthYear},
        ${testRecord.nationalId},
        ${testRecord.fatherName},
        ${testRecord.motherName}
      )
      RETURNING id, first_name, last_name, location, birth_year, national_id
    `;

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].first_name).toBe(testRecord.firstName);
    expect(result.rows[0].last_name).toBe(testRecord.lastName);
    expect(result.rows[0].location).toBe(testRecord.location);
    expect(result.rows[0].birth_year).toBe(testRecord.birthYear);

    insertedRecordId = result.rows[0].id;
    console.log(`\n✅ Record inserted successfully with ID: ${insertedRecordId}`);
    console.log(`   Name: ${testRecord.firstName} ${testRecord.lastName}`);
    console.log(`   Location: ${testRecord.location}`);
    console.log(`   Birth Year: ${testRecord.birthYear}\n`);
  });

  it('should retrieve the record directly from database to prove it exists', async () => {
    const result = await sql`
      SELECT id, first_name, last_name, location, birth_year, national_id,
             father_name, mother_name, submitted_at
      FROM records
      WHERE first_name = ${testRecord.firstName}
        AND last_name = ${testRecord.lastName}
      ORDER BY id DESC
      LIMIT 1
    `;

    expect(result.rows).toHaveLength(1);
    const record = result.rows[0];

    expect(record.first_name).toBe(testRecord.firstName);
    expect(record.last_name).toBe(testRecord.lastName);
    expect(record.location).toBe(testRecord.location);
    expect(record.birth_year).toBe(testRecord.birthYear);
    expect(record.national_id).toBe(testRecord.nationalId);
    expect(record.father_name).toBe(testRecord.fatherName);
    expect(record.mother_name).toBe(testRecord.motherName);
    expect(record.submitted_at).toBeDefined();

    console.log(`✅ Record verified in database:`);
    console.log(`   ID: ${record.id}`);
    console.log(`   Full details match expected values`);
    console.log(`   Submitted at: ${record.submitted_at.toISOString()}\n`);
  });
});
