CREATE TABLE "evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"hashtags" text,
	"search_text" text,
	"submitter_twitter_id" varchar(255),
	"verified" boolean DEFAULT false,
	"verification_level" varchar(50) DEFAULT 'unverified',
	"evidence_count" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "external_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"security_force_id" integer,
	"ir_agent_id" integer,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "field_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_type" varchar(20) NOT NULL,
	"record_id" integer NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"submitter_twitter_id" varchar(100),
	"submitter_ip" varchar(45),
	"submitter_user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ir_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"first_name_en" varchar(255),
	"last_name_en" varchar(255),
	"agent_type" varchar(50) NOT NULL,
	"city" varchar(255),
	"country" varchar(255),
	"address" text,
	"residence_address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"affiliation" varchar(255),
	"role" varchar(255),
	"twitter_handle" varchar(255),
	"instagram_handle" varchar(255),
	"additional_info" text,
	"hashtags" text,
	"search_text" text,
	"submitter_twitter_id" varchar(255),
	"verified" boolean DEFAULT false,
	"verification_level" varchar(50) DEFAULT 'unverified',
	"evidence_count" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer,
	"security_force_id" integer,
	"ir_agent_id" integer,
	"video_id" integer,
	"evidence_id" integer,
	"type" varchar(50) NOT NULL,
	"r2_key" varchar(500) NOT NULL,
	"public_url" text NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_size" bigint NOT NULL,
	"is_primary" boolean DEFAULT false,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"first_name_en" varchar(255),
	"last_name_en" varchar(255),
	"location" varchar(255) NOT NULL,
	"birth_year" integer,
	"incident_date" date,
	"national_id" varchar(255),
	"father_name" varchar(255),
	"mother_name" varchar(255),
	"victim_status" varchar(50) DEFAULT 'killed',
	"gender" varchar(20),
	"perpetrator" text,
	"hashtags" text,
	"additional_info" text,
	"submitter_twitter_id" varchar(255),
	"search_text" text,
	"verified" boolean DEFAULT false,
	"verification_level" varchar(50) DEFAULT 'unverified',
	"evidence_count" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "security_forces" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"first_name_en" varchar(255),
	"last_name_en" varchar(255),
	"city" varchar(255) NOT NULL,
	"address" text,
	"residence_address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"organization" varchar(255),
	"rank_position" varchar(255),
	"twitter_handle" varchar(255),
	"instagram_handle" varchar(255),
	"additional_info" text,
	"hashtags" text,
	"search_text" text,
	"submitter_twitter_id" varchar(255),
	"verified" boolean DEFAULT false,
	"verification_level" varchar(50) DEFAULT 'unverified',
	"evidence_count" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "twitter_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"location" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"hashtags" text,
	"submitter_twitter_id" varchar(255),
	"verified" boolean DEFAULT false,
	"verification_level" varchar(50) DEFAULT 'unverified',
	"evidence_count" integer DEFAULT 0,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_security_force_id_security_forces_id_fk" FOREIGN KEY ("security_force_id") REFERENCES "public"."security_forces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_ir_agent_id_ir_agents_id_fk" FOREIGN KEY ("ir_agent_id") REFERENCES "public"."ir_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_security_force_id_security_forces_id_fk" FOREIGN KEY ("security_force_id") REFERENCES "public"."security_forces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_ir_agent_id_ir_agents_id_fk" FOREIGN KEY ("ir_agent_id") REFERENCES "public"."ir_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twitter_links" ADD CONSTRAINT "twitter_links_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;