import { createClient } from '@supabase/supabase-js';

// Server-only: these env vars have no NEXT_PUBLIC_ prefix,
// so they are never bundled into the client-side JS.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** Supabase PostgREST default limit is 1000 rows. Use this constant for pagination. */
export const PAGE_SIZE = 1000;
