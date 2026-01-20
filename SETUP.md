# Setup Guide

## Next Steps to Get Javidan Running

### 1. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier M0 is fine)
4. Create a database user:
   - Go to Database Access
   - Add New Database User
   - Choose username/password authentication
   - Save the credentials
5. Whitelist your IP:
   - Go to Network Access
   - Add IP Address
   - For development: Allow Access from Anywhere (0.0.0.0/0)
6. Get connection string:
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Add `/javidan` at the end: `mongodb+srv://user:pass@cluster.mongodb.net/javidan?retryWrites=true&w=majority`

### 2. Set Up Cloudflare R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account → R2
3. Create a new bucket:
   - Click "Create bucket"
   - Name: `javidan-media`
   - Location: Automatic
4. Get credentials:
   - Go to R2 → Manage R2 API Tokens
   - Create API Token
   - Permissions: Object Read & Write
   - Copy: Access Key ID and Secret Access Key
5. Get Account ID:
   - Find it in the R2 Overview page
6. Set up public access:
   - Go to your bucket → Settings
   - Under "Public access" → Connect Domain
   - Or use R2.dev subdomain for testing

### 3. Configure Environment Variables

Edit `.env.local`:

```env
# MongoDB (from step 1)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/javidan?retryWrites=true&w=majority

# Cloudflare R2 (from step 2)
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=javidan-media
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev  # or your custom domain
```

### 4. Test Locally

```bash
# Run development server
npm run dev

# Open http://localhost:3000
# Try submitting a test record
```

### 5. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Import your repository: `TempleOfNayra/javidan`
4. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build` (default)
   - Environment Variables: Add all from `.env.local`
5. Click Deploy
6. Your site will be live at `https://javidan.vercel.app` (or custom domain)

### 6. Set Up Custom Domain (Optional)

In Vercel:
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Common Issues

**MongoDB Connection Error**
- Check connection string format
- Verify IP whitelist includes your current IP
- Ensure database user has correct permissions

**R2 Upload Fails**
- Verify API token has Object Read & Write permissions
- Check bucket name matches exactly
- Confirm public URL is correct

**Build Errors on Vercel**
- Make sure all environment variables are set
- Check Node.js version (should be 18+)
- Review build logs for specific errors

### Environment Variables Checklist

Before deploying, ensure these are set in Vercel:

- [ ] MONGODB_URI
- [ ] R2_ACCOUNT_ID
- [ ] R2_ACCESS_KEY_ID
- [ ] R2_SECRET_ACCESS_KEY
- [ ] R2_BUCKET_NAME
- [ ] R2_PUBLIC_URL

## Need Help?

- Check the [main README](./README.md) for more details
- Review Next.js docs: https://nextjs.org/docs
- MongoDB Atlas docs: https://docs.atlas.mongodb.com/
- Cloudflare R2 docs: https://developers.cloudflare.com/r2/
