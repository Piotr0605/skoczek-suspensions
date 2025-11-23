import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grbhizjizflxnvmrdlls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYmhpemppemZseG52bXJkbGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTMxMDksImV4cCI6MjA3OTM2OTEwOX0.EYHK1qtHuWQGnIxPoBwkNVrTLdcevSW_9fXJ7K5GiZ0'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);