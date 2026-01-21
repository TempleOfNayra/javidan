import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from '@/lib/db';

describe('Database Operations', () => {
  const testRecord = {
    firstName: 'Test',
    lastName: 'User',
    location: 'Tehran',
    birthYear: 1990,
    nationalId: '1234567890',
    fatherName: 'Test Father',
    motherName: 'Test Mother',
  };

  let insertedRecordId: number;

  beforeAll(async () => {
    // Initialize database tables before running tests
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

    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES records(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        r2_key VARCHAR(500) NOT NULL,
        public_url TEXT NOT NULL,
        file_name VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `;
  });

  afterAll(async () => {
    // Clean up test record after tests
    if (insertedRecordId) {
      await sql`DELETE FROM records WHERE id = ${insertedRecordId}`;
    }
  });

  it('should insert a record into the database', async () => {
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
      RETURNING id, first_name, last_name, location, birth_year, national_id, father_name, mother_name
    `;

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].first_name).toBe(testRecord.firstName);
    expect(result.rows[0].last_name).toBe(testRecord.lastName);
    expect(result.rows[0].location).toBe(testRecord.location);
    expect(result.rows[0].birth_year).toBe(testRecord.birthYear);

    insertedRecordId = result.rows[0].id;
    expect(insertedRecordId).toBeDefined();
  });

  it('should retrieve the inserted record from the database', async () => {
    expect(insertedRecordId).toBeDefined();

    const result = await sql`
      SELECT id, first_name, last_name, location, birth_year, national_id, father_name, mother_name
      FROM records
      WHERE id = ${insertedRecordId}
    `;

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(insertedRecordId);
    expect(result.rows[0].first_name).toBe(testRecord.firstName);
    expect(result.rows[0].last_name).toBe(testRecord.lastName);
    expect(result.rows[0].location).toBe(testRecord.location);
    expect(result.rows[0].birth_year).toBe(testRecord.birthYear);
    expect(result.rows[0].national_id).toBe(testRecord.nationalId);
    expect(result.rows[0].father_name).toBe(testRecord.fatherName);
    expect(result.rows[0].mother_name).toBe(testRecord.motherName);
  });

  it('should search for records by name', async () => {
    const searchPattern = `%${testRecord.firstName}%`;

    const result = await sql`
      SELECT id, first_name, last_name, location
      FROM records
      WHERE LOWER(first_name) LIKE LOWER(${searchPattern})
    `;

    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    const foundRecord = result.rows.find((r: any) => r.id === insertedRecordId);
    expect(foundRecord).toBeDefined();
    expect(foundRecord.first_name).toBe(testRecord.firstName);
  });
});
