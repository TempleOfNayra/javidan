# Javidan (جاویدان - Eternal)

A public memorial and archive documenting the lives lost during Iran's revolution. Community-driven, open-source, and dedicated to preserving the truth.

## 🎯 Mission

Javidan is an open-source, crowd-sourced memorial dedicated to documenting and honoring those who lost their lives during Iran's ongoing revolution. We believe in transparency, community verification, and preserving the truth for future generations.

## ✨ Features

- **Submit Records**: Community members can submit information about victims
- **Search & Filter**: Search by name, location, and birth year
- **Media Upload**: Support for photos, videos, and documents via Cloudflare R2
- **Verification System**: Multi-tiered verification (unverified → community → document → trusted)
- **Responsive Design**: Modern, accessible interface with dark mode support

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **Media Storage**: Cloudflare R2
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier available)
- Cloudflare account with R2 access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TempleOfNayra/javidan.git
cd javidan
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Cloudflare R2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=javidan-media
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
javidan/
├── app/
│   ├── api/
│   │   └── submit/          # API route for form submissions
│   ├── record/[id]/         # Individual record detail page
│   ├── search/              # Search and browse records
│   ├── submit/              # Submit new record form
│   └── page.tsx             # Homepage
├── lib/
│   ├── mongodb.ts           # MongoDB connection
│   ├── r2.ts                # Cloudflare R2 utilities
│   └── types/
│       └── record.ts        # TypeScript types
└── public/
```

## 🗄️ Data Model

```typescript
interface VictimRecord {
  _id: string;
  // Required
  firstName: string;
  lastName: string;
  location: string; // City/Province

  // Optional
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
```

## 🔐 Security & Privacy

- All media files are stored securely in Cloudflare R2
- No tracking or analytics that could compromise users
- Support for anonymous submissions
- EXIF metadata stripping (to be implemented)

## 🤝 Contributing

This is an open-source project and contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Roadmap

### v1 (Current)
- [x] Basic homepage with statistics
- [x] Submit form with media upload
- [x] Search and filter functionality
- [x] Individual record pages
- [ ] MongoDB and R2 setup documentation

### v2 (Future)
- [ ] Add Evidence feature (community contributions)
- [ ] User accounts and authentication
- [ ] Admin dashboard for moderation
- [ ] Advanced search and filtering
- [ ] Export data (CSV, JSON)
- [ ] API for researchers
- [ ] Multi-language support (Farsi/English)
- [ ] EXIF metadata stripping
- [ ] Automated verification algorithms

## 📄 License

This project is open-source and available under the MIT License.

## 💙 Acknowledgments

In memory of all those who lost their lives fighting for freedom and justice.

---

**Note**: This platform is dedicated to preserving truth and honoring victims. All submissions are public and subject to community verification.
