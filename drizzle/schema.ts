import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, bigint, date, uuid } from 'drizzle-orm/pg-core';

export const records = pgTable('records', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').defaultRandom().notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  firstNameEn: varchar('first_name_en', { length: 255 }),
  lastNameEn: varchar('last_name_en', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  fullNameEn: varchar('full_name_en', { length: 255 }),
  location: varchar('location', { length: 255 }).notNull(),
  birthYear: integer('birth_year'),
  age: integer('age'),
  incidentDate: date('incident_date'),
  nationalId: varchar('national_id', { length: 255 }),
  fatherName: varchar('father_name', { length: 255 }),
  motherName: varchar('mother_name', { length: 255 }),
  victimStatus: varchar('victim_status', { length: 50 }).default('killed'),
  gender: varchar('gender', { length: 20 }),
  perpetrator: text('perpetrator'),
  hashtags: text('hashtags'),
  additionalInfo: text('additional_info'),
  submitterTwitterId: varchar('submitter_twitter_id', { length: 255 }),
  searchText: text('search_text'),
  verified: boolean('verified').default(false),
  verificationLevel: varchar('verification_level', { length: 50 }).default('unverified'),
  evidenceCount: integer('evidence_count').default(0),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const securityForces = pgTable('security_forces', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').defaultRandom().notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  firstNameEn: varchar('first_name_en', { length: 255 }),
  lastNameEn: varchar('last_name_en', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  fullNameEn: varchar('full_name_en', { length: 255 }),
  city: varchar('city', { length: 255 }).notNull(),
  address: text('address'),
  residenceAddress: text('residence_address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  organization: varchar('organization', { length: 255 }),
  rankPosition: varchar('rank_position', { length: 255 }),
  twitterHandle: varchar('twitter_handle', { length: 255 }),
  instagramHandle: varchar('instagram_handle', { length: 255 }),
  additionalInfo: text('additional_info'),
  hashtags: text('hashtags'),
  searchText: text('search_text'),
  submitterTwitterId: varchar('submitter_twitter_id', { length: 255 }),
  verified: boolean('verified').default(false),
  verificationLevel: varchar('verification_level', { length: 50 }).default('unverified'),
  evidenceCount: integer('evidence_count').default(0),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const irAgents = pgTable('ir_agents', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').defaultRandom().notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  firstNameEn: varchar('first_name_en', { length: 255 }),
  lastNameEn: varchar('last_name_en', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  fullNameEn: varchar('full_name_en', { length: 255 }),
  agentType: varchar('agent_type', { length: 50 }).notNull(),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 255 }),
  address: text('address'),
  residenceAddress: text('residence_address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  affiliation: varchar('affiliation', { length: 255 }),
  role: varchar('role', { length: 255 }),
  twitterHandle: varchar('twitter_handle', { length: 255 }),
  instagramHandle: varchar('instagram_handle', { length: 255 }),
  additionalInfo: text('additional_info'),
  hashtags: text('hashtags'),
  searchText: text('search_text'),
  submitterTwitterId: varchar('submitter_twitter_id', { length: 255 }),
  verified: boolean('verified').default(false),
  verificationLevel: varchar('verification_level', { length: 50 }).default('unverified'),
  evidenceCount: integer('evidence_count').default(0),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').defaultRandom().notNull().unique(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description').notNull(),
  hashtags: text('hashtags'),
  submitterTwitterId: varchar('submitter_twitter_id', { length: 255 }),
  verified: boolean('verified').default(false),
  verificationLevel: varchar('verification_level', { length: 50 }).default('unverified'),
  evidenceCount: integer('evidence_count').default(0),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const evidence = pgTable('evidence', {
  id: serial('id').primaryKey(),
  publicId: uuid('public_id').defaultRandom().notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  hashtags: text('hashtags'),
  searchText: text('search_text'),
  submitterTwitterId: varchar('submitter_twitter_id', { length: 255 }),
  verified: boolean('verified').default(false),
  verificationLevel: varchar('verification_level', { length: 50 }).default('unverified'),
  evidenceCount: integer('evidence_count').default(0),
  submittedAt: timestamp('submitted_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  recordId: integer('record_id').references(() => records.id, { onDelete: 'cascade' }),
  securityForceId: integer('security_force_id').references(() => securityForces.id, { onDelete: 'cascade' }),
  irAgentId: integer('ir_agent_id').references(() => irAgents.id, { onDelete: 'cascade' }),
  videoId: integer('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  evidenceId: integer('evidence_id').references(() => evidence.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  r2Key: varchar('r2_key', { length: 500 }).notNull(),
  publicUrl: text('public_url').notNull(),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  isPrimary: boolean('is_primary').default(false),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const twitterLinks = pgTable('twitter_links', {
  id: serial('id').primaryKey(),
  recordId: integer('record_id').references(() => records.id, { onDelete: 'cascade' }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const externalLinks = pgTable('external_links', {
  id: serial('id').primaryKey(),
  securityForceId: integer('security_force_id').references(() => securityForces.id, { onDelete: 'cascade' }),
  irAgentId: integer('ir_agent_id').references(() => irAgents.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const fieldUpdates = pgTable('field_updates', {
  id: serial('id').primaryKey(),
  recordType: varchar('record_type', { length: 20 }).notNull(), // 'victim', 'agent', 'force', 'video', 'document'
  recordId: integer('record_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  oldValue: text('old_value'), // Should be NULL for new field fills
  newValue: text('new_value').notNull(),
  submitterTwitterId: varchar('submitter_twitter_id', { length: 100 }),
  submitterIp: varchar('submitter_ip', { length: 45 }), // For rate limiting until auth
  submitterUserId: integer('submitter_user_id'), // For future auth integration
  createdAt: timestamp('created_at').defaultNow(),
});
