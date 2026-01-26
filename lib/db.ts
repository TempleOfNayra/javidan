import { neon } from '@neondatabase/serverless';
import { DATABASE_CONFIG } from './config';

// Lazy connection initialization
let sqlClient: ReturnType<typeof neon> | null = null;

function getConnection() {
  if (!sqlClient) {
    const varName = `${DATABASE_CONFIG.DB_PREFIX}POSTGRES_URL`;
    const connectionString = process.env[varName];

    if (!connectionString) {
      // Debug: log all available env vars that start with javidanaman
      const availableVars = Object.keys(process.env).filter(k => k.includes('javidan') || k.includes('POSTGRES'));
      console.error('Available env vars:', availableVars);
      console.error('Looking for:', varName);
      throw new Error(`Environment variable '${varName}' not found. Available: ${availableVars.join(', ')}`);
    }

    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

// Wrap to match @vercel/postgres API (returns {rows} format)
export const sql = async (strings: TemplateStringsArray, ...values: any[]): Promise<{ rows: any[] }> => {
  const client = getConnection();
  const rows = await client(strings, ...values);
  return { rows: rows as any[] };
};

// Initialize database tables
export async function initDatabase() {
  try {
    // Create records table
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

    // Create media table
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

    // Create twitter_links table (one-to-many relation)
    await sql`
      CREATE TABLE IF NOT EXISTS twitter_links (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES records(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create security_forces table
    await sql`
      CREATE TABLE IF NOT EXISTS security_forces (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        first_name_en VARCHAR(255),
        last_name_en VARCHAR(255),
        city VARCHAR(255) NOT NULL,
        address TEXT,
        residence_address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        organization VARCHAR(255),
        rank_position VARCHAR(255),
        twitter_handle VARCHAR(255),
        instagram_handle VARCHAR(255),
        additional_info TEXT,
        hashtags TEXT,
        search_text TEXT,
        submitter_twitter_id VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        verification_level VARCHAR(50) DEFAULT 'unverified',
        evidence_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add social media columns if they don't exist (migration)
    await sql`
      ALTER TABLE security_forces
      ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255),
      ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(255)
    `;

    // Create external_links table (for security forces and IR agents)
    await sql`
      CREATE TABLE IF NOT EXISTS external_links (
        id SERIAL PRIMARY KEY,
        security_force_id INTEGER REFERENCES security_forces(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add ir_agent_id to external_links table
    await sql`
      ALTER TABLE external_links
      ADD COLUMN IF NOT EXISTS ir_agent_id INTEGER REFERENCES ir_agents(id) ON DELETE CASCADE
    `;

    // Add new columns if they don't exist
    await sql`
      ALTER TABLE records
      ADD COLUMN IF NOT EXISTS hashtags TEXT,
      ADD COLUMN IF NOT EXISTS additional_info TEXT,
      ADD COLUMN IF NOT EXISTS submitter_twitter_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS victim_status VARCHAR(50) DEFAULT 'killed',
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS first_name_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name_en VARCHAR(255),
      ADD COLUMN IF NOT EXISTS perpetrator TEXT,
      ADD COLUMN IF NOT EXISTS incident_date DATE
    `;

    // Remove old twitter_url column if it exists (migration)
    await sql`
      ALTER TABLE records
      DROP COLUMN IF EXISTS twitter_url
    `;

    // Add is_primary column to media table (to distinguish victim picture from supporting docs)
    await sql`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false
    `;

    // Add security_force_id to media table to support both victims and security forces
    await sql`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS security_force_id INTEGER REFERENCES security_forces(id) ON DELETE CASCADE
    `;

    // Add video_id to media table to support videos
    await sql`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE
    `;

    // Add ir_agent_id to media table to support IR agents
    await sql`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS ir_agent_id INTEGER REFERENCES ir_agents(id) ON DELETE CASCADE
    `;

    // Add evidence_id to media table to support evidence
    await sql`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE
    `;

    // Make record_id nullable since we can now have either record_id OR security_force_id OR video_id OR ir_agent_id OR evidence_id
    await sql`
      ALTER TABLE media
      ALTER COLUMN record_id DROP NOT NULL
    `;

    // Add search_text column for unified searching
    await sql`
      ALTER TABLE records
      ADD COLUMN IF NOT EXISTS search_text TEXT
    `;

    // Create or replace function to update search_text
    await sql`
      CREATE OR REPLACE FUNCTION update_search_text()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_text := LOWER(
          COALESCE(NEW.first_name, '') || ' ' ||
          COALESCE(NEW.last_name, '') || ' ' ||
          COALESCE(NEW.first_name_en, '') || ' ' ||
          COALESCE(NEW.last_name_en, '') || ' ' ||
          COALESCE(NEW.location, '') || ' ' ||
          COALESCE(NEW.national_id, '') || ' ' ||
          COALESCE(NEW.father_name, '') || ' ' ||
          COALESCE(NEW.mother_name, '') || ' ' ||
          COALESCE(NEW.hashtags, '') || ' ' ||
          COALESCE(NEW.additional_info, '') || ' ' ||
          COALESCE(NEW.perpetrator, '') || ' ' ||
          COALESCE(CAST(NEW.birth_year AS TEXT), '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create trigger to automatically update search_text on insert/update
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_search_text ON records
    `;

    await sql`
      CREATE TRIGGER trigger_update_search_text
      BEFORE INSERT OR UPDATE ON records
      FOR EACH ROW
      EXECUTE FUNCTION update_search_text()
    `;

    // Update existing records to populate search_text
    await sql`
      UPDATE records
      SET search_text = LOWER(
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(first_name_en, '') || ' ' ||
        COALESCE(last_name_en, '') || ' ' ||
        COALESCE(location, '') || ' ' ||
        COALESCE(national_id, '') || ' ' ||
        COALESCE(father_name, '') || ' ' ||
        COALESCE(mother_name, '') || ' ' ||
        COALESCE(hashtags, '') || ' ' ||
        COALESCE(additional_info, '') || ' ' ||
        COALESCE(perpetrator, '') || ' ' ||
        COALESCE(CAST(birth_year AS TEXT), '')
      )
      WHERE search_text IS NULL
    `;

    // Create indexes for better search performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_location ON records(location)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_names ON records(first_name, last_name)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_search_text ON records USING gin(to_tsvector('simple', search_text))
    `;

    // Create or replace function to update search_text for security_forces
    await sql`
      CREATE OR REPLACE FUNCTION update_security_force_search_text()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_text := LOWER(
          COALESCE(NEW.first_name, '') || ' ' ||
          COALESCE(NEW.last_name, '') || ' ' ||
          COALESCE(NEW.first_name_en, '') || ' ' ||
          COALESCE(NEW.last_name_en, '') || ' ' ||
          COALESCE(NEW.city, '') || ' ' ||
          COALESCE(NEW.address, '') || ' ' ||
          COALESCE(NEW.residence_address, '') || ' ' ||
          COALESCE(NEW.organization, '') || ' ' ||
          COALESCE(NEW.rank_position, '') || ' ' ||
          COALESCE(NEW.twitter_handle, '') || ' ' ||
          COALESCE(NEW.instagram_handle, '') || ' ' ||
          COALESCE(NEW.hashtags, '') || ' ' ||
          COALESCE(NEW.additional_info, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create trigger for security_forces
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_security_force_search_text ON security_forces
    `;

    await sql`
      CREATE TRIGGER trigger_update_security_force_search_text
      BEFORE INSERT OR UPDATE ON security_forces
      FOR EACH ROW
      EXECUTE FUNCTION update_security_force_search_text()
    `;

    // Update existing security_forces records to populate search_text
    await sql`
      UPDATE security_forces
      SET search_text = LOWER(
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(first_name_en, '') || ' ' ||
        COALESCE(last_name_en, '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(address, '') || ' ' ||
        COALESCE(residence_address, '') || ' ' ||
        COALESCE(organization, '') || ' ' ||
        COALESCE(rank_position, '') || ' ' ||
        COALESCE(twitter_handle, '') || ' ' ||
        COALESCE(instagram_handle, '') || ' ' ||
        COALESCE(hashtags, '') || ' ' ||
        COALESCE(additional_info, '')
      )
      WHERE search_text IS NULL
    `;

    // Create indexes for security_forces
    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_forces_city ON security_forces(city)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_forces_names ON security_forces(first_name, last_name)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_forces_organization ON security_forces(organization)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_forces_search_text ON security_forces USING gin(to_tsvector('simple', search_text))
    `;

    // Create videos table
    await sql`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        location VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        hashtags TEXT,
        submitter_twitter_id VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        verification_level VARCHAR(50) DEFAULT 'unverified',
        evidence_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create ir_agents table
    await sql`
      CREATE TABLE IF NOT EXISTS ir_agents (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        first_name_en VARCHAR(255),
        last_name_en VARCHAR(255),
        agent_type VARCHAR(50) NOT NULL,
        city VARCHAR(255),
        country VARCHAR(255),
        address TEXT,
        residence_address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        affiliation VARCHAR(255),
        role VARCHAR(255),
        twitter_handle VARCHAR(255),
        instagram_handle VARCHAR(255),
        additional_info TEXT,
        hashtags TEXT,
        search_text TEXT,
        submitter_twitter_id VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        verification_level VARCHAR(50) DEFAULT 'unverified',
        evidence_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create or replace function to update search_text for ir_agents
    await sql`
      CREATE OR REPLACE FUNCTION update_ir_agent_search_text()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_text := LOWER(
          COALESCE(NEW.first_name, '') || ' ' ||
          COALESCE(NEW.last_name, '') || ' ' ||
          COALESCE(NEW.first_name_en, '') || ' ' ||
          COALESCE(NEW.last_name_en, '') || ' ' ||
          COALESCE(NEW.city, '') || ' ' ||
          COALESCE(NEW.country, '') || ' ' ||
          COALESCE(NEW.address, '') || ' ' ||
          COALESCE(NEW.residence_address, '') || ' ' ||
          COALESCE(NEW.affiliation, '') || ' ' ||
          COALESCE(NEW.role, '') || ' ' ||
          COALESCE(NEW.twitter_handle, '') || ' ' ||
          COALESCE(NEW.instagram_handle, '') || ' ' ||
          COALESCE(NEW.hashtags, '') || ' ' ||
          COALESCE(NEW.additional_info, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create trigger for ir_agents
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_ir_agent_search_text ON ir_agents
    `;

    await sql`
      CREATE TRIGGER trigger_update_ir_agent_search_text
      BEFORE INSERT OR UPDATE ON ir_agents
      FOR EACH ROW
      EXECUTE FUNCTION update_ir_agent_search_text()
    `;

    // Update existing ir_agents records to populate search_text
    await sql`
      UPDATE ir_agents
      SET search_text = LOWER(
        COALESCE(first_name, '') || ' ' ||
        COALESCE(last_name, '') || ' ' ||
        COALESCE(first_name_en, '') || ' ' ||
        COALESCE(last_name_en, '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(country, '') || ' ' ||
        COALESCE(address, '') || ' ' ||
        COALESCE(residence_address, '') || ' ' ||
        COALESCE(affiliation, '') || ' ' ||
        COALESCE(role, '') || ' ' ||
        COALESCE(twitter_handle, '') || ' ' ||
        COALESCE(instagram_handle, '') || ' ' ||
        COALESCE(hashtags, '') || ' ' ||
        COALESCE(additional_info, '')
      )
      WHERE search_text IS NULL
    `;

    // Create indexes for ir_agents
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ir_agents_agent_type ON ir_agents(agent_type)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ir_agents_city ON ir_agents(city)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ir_agents_country ON ir_agents(country)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ir_agents_names ON ir_agents(first_name, last_name)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ir_agents_affiliation ON ir_agents(affiliation)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ir_agents_search_text ON ir_agents USING gin(to_tsvector('simple', search_text))
    `;

    // Create evidence table
    await sql`
      CREATE TABLE IF NOT EXISTS evidence (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        hashtags TEXT,
        search_text TEXT,
        submitter_twitter_id VARCHAR(255),
        verified BOOLEAN DEFAULT false,
        verification_level VARCHAR(50) DEFAULT 'unverified',
        evidence_count INTEGER DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create or replace function to update search_text for evidence
    await sql`
      CREATE OR REPLACE FUNCTION update_evidence_search_text()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_text := LOWER(
          COALESCE(NEW.title, '') || ' ' ||
          COALESCE(NEW.description, '') || ' ' ||
          COALESCE(NEW.hashtags, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create trigger for evidence
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_evidence_search_text ON evidence
    `;

    await sql`
      CREATE TRIGGER trigger_update_evidence_search_text
      BEFORE INSERT OR UPDATE ON evidence
      FOR EACH ROW
      EXECUTE FUNCTION update_evidence_search_text()
    `;

    // Update existing evidence records to populate search_text
    await sql`
      UPDATE evidence
      SET search_text = LOWER(
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(hashtags, '')
      )
      WHERE search_text IS NULL
    `;

    // Create indexes for evidence
    await sql`
      CREATE INDEX IF NOT EXISTS idx_evidence_title ON evidence(title)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_evidence_search_text ON evidence USING gin(to_tsvector('simple', search_text))
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't throw - let the app continue even if tables already exist
  }
}
