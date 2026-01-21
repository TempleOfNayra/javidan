// This file runs before any other code in the application
// Use it to set up environment variables that need to be available at import time

export function register() {
  // Copy prefixed Vercel environment variables to standard names
  const DB_PREFIX = process.env.DB_PREFIX || '';

  if (DB_PREFIX) {
    const prefixedUrl = process.env[`${DB_PREFIX}POSTGRES_URL`];
    const prefixedPrisma = process.env[`${DB_PREFIX}POSTGRES_PRISMA_URL`];
    const prefixedNonPooling = process.env[`${DB_PREFIX}POSTGRES_URL_NON_POOLING`];

    if (prefixedUrl && !process.env.POSTGRES_URL) {
      process.env.POSTGRES_URL = prefixedUrl;
      console.log(`[Instrumentation] Set POSTGRES_URL from ${DB_PREFIX}POSTGRES_URL`);
    }
    if (prefixedPrisma && !process.env.POSTGRES_PRISMA_URL) {
      process.env.POSTGRES_PRISMA_URL = prefixedPrisma;
    }
    if (prefixedNonPooling && !process.env.POSTGRES_URL_NON_POOLING) {
      process.env.POSTGRES_URL_NON_POOLING = prefixedNonPooling;
    }
  }
}
