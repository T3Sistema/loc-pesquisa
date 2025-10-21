import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okszxuogiiiggpudvmks.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rc3p4dW9naWlpZ2dwdWR2bWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTg4NTcsImV4cCI6MjA3NjM5NDg1N30.8s5UDIae5gYnwkKnBlV6OPSQhGhE8g8fU489V7r1suc';

export const supabase = createClient(supabaseUrl, supabaseKey);
