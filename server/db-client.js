import { createClient } from '@supabase/supabase-js';

// This module runs only in Vercel Serverless Functions. Never expose the
// service-role key through a VITE_ or NEXT_PUBLIC_ variable.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;
