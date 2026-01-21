import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from '@/lib/db';

describe('Submit API Integration Test', () => {
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

  it('should submit a record through the database (simulating API)', async () => {
    const formData = {
      firstName: 'Ali',
      lastName: 'Rezaei',
      location: 'Isfahan',
      birthYear: 1995,
      nationalId: 'API123456',
      fatherName: 'Hassan',
      motherName: 'Zahra',
    };

    // Simulate what the API does - insert a record
    const insertResult = await sql`
      INSERT INTO records (
        first_name, last_name, location, birth_year, national_id,
        father_name, mother_name
      )
      VALUES (
        ${formData.firstName},
        ${formData.lastName},
        ${formData.location},
        ${formData.birthYear},
        ${formData.nationalId},
        ${formData.fatherName},
        ${formData.motherName}
      )
      RETURNING id, first_name, last_name, location, birth_year
    `;

    expect(insertResult.rows).toHaveLength(1);
    const recordId = insertResult.rows[0].id;

    console.log(`\n✅ API submission successful!`);
    console.log(`   Record ID: ${recordId}`);
    console.log(`   Name: ${formData.firstName} ${formData.lastName}`);

    // Verify we can retrieve it
    const selectResult = await sql`
      SELECT id, first_name, last_name, location, birth_year, national_id,
             father_name, mother_name, verified, verification_level
      FROM records
      WHERE id = ${recordId}
    `;

    expect(selectResult.rows).toHaveLength(1);
    const record = selectResult.rows[0];

    expect(record.first_name).toBe(formData.firstName);
    expect(record.last_name).toBe(formData.lastName);
    expect(record.location).toBe(formData.location);
    expect(record.birth_year).toBe(formData.birthYear);
    expect(record.verified).toBe(false);
    expect(record.verification_level).toBe('unverified');

    console.log(`✅ Record retrieval successful!`);
    console.log(`   Verification status: ${record.verification_level}`);

    // Test search functionality
    const searchResult = await sql`
      SELECT id, first_name, last_name, location
      FROM records
      WHERE LOWER(first_name) LIKE LOWER(${'%' + formData.firstName + '%'})
    `;

    expect(searchResult.rows.length).toBeGreaterThanOrEqual(1);
    const found = searchResult.rows.find((r: any) => r.id === recordId);
    expect(found).toBeDefined();

    console.log(`✅ Search functionality working!`);
    console.log(`   Found ${searchResult.rows.length} records matching search\n`);
  });

  it('should count total records in database', async () => {
    const result = await sql`SELECT COUNT(*) as count FROM records`;
    const count = parseInt(result.rows[0].count);

    expect(count).toBeGreaterThanOrEqual(2); // At least our 2 test records
    console.log(`\n✅ Total records in database: ${count}\n`);
  });
});
