import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rbcyxdfknuvyigwdxatt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiY3l4ZGZrbnV2eWlnd2R4YXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ4ODE4MiwiZXhwIjoyMDg2MDY0MTgyfQ.if74wMfkd5QIQlDpEEnDB0np0GJh8GyAQEFE6uOMg0U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
