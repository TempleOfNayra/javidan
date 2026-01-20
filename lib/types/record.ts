export interface MediaFile {
  type: 'image' | 'video' | 'document';
  r2Key: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
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
  files?: File[];
}
