/**
 * Configuration from environment variables.
 * Fallbacks preserve compatibility with the existing Vercel deployment.
 * Recommended: set VITE_* in Environment Variables and remove fallbacks after migration.
 */
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://grbhizjizflxnvmrdlls.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYmhpemppemZseG52bXJkbGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTMxMDksImV4cCI6MjA3OTM2OTEwOX0.EYHK1qtHuWQGnIxPoBwkNVrTLdcevSW_9fXJ7K5GiZ0',
  },
} as const;
