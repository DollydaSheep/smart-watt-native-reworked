import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuvamvpfxhzuvvnvtqhj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1dmFtdnBmeGh6dXZ2bnZ0cWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzAyMjcsImV4cCI6MjA4NzQwNjIyN30.tG0HHDDRXVK27Opj4SqojTShrwkkCpewb5aQqWAekns";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});