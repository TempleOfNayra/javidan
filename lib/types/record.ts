export interface MediaFile {
  type: 'image' | 'video' | 'document';
  r2Key: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface TwitterLink {
  id?: number;
  url: string;
  createdAt?: Date;
}

export interface VictimRecord {
  _id?: string;
  // Required fields
  firstName: string;
  lastName: string;
  location: string; // City/Province

  // Optional fields
  birthYear?: number;
  nationalId?: string;
  fatherName?: string;
  motherName?: string;

  // New fields
  hashtags?: string; // Comma-separated tags
  additionalInfo?: string; // Extra details, evidence description
  twitterLinks: TwitterLink[]; // Array of Twitter/X links
  submitterTwitterId?: string; // Twitter ID of person submitting (optional)
  victimStatus: 'killed' | 'incarcerated' | 'disappeared' | 'injured'; // Victim status

  // Media
  media: MediaFile[];

  // Verification
  verified: boolean;
  verificationLevel: 'unverified' | 'community' | 'document' | 'trusted';
  evidenceCount: number;

  // Metadata
  submittedAt: Date;
  updatedAt: Date;
}

export interface SubmissionFormData {
  firstName: string;
  lastName: string;
  location: string;
  birthYear?: number;
  nationalId?: string;
  fatherName?: string;
  motherName?: string;
  hashtags?: string;
  additionalInfo?: string;
  twitterUrl1?: string;
  twitterUrl2?: string;
  twitterUrl3?: string;
  submitterTwitterId?: string;
  victimStatus?: 'killed' | 'incarcerated' | 'disappeared' | 'injured';
  files?: File[];
}
