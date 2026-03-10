import { createClient } from '@supabase/supabase-js';

const ARTIST_AGENT_URL = "https://tiuyxkgguvjbmdeyybcg.supabase.co";
const ARTIST_AGENT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdXl4a2dndXZqYm1kZXl5YmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDE2NzYsImV4cCI6MjA2NDQ3NzY3Nn0.opUyPZ9hQLXssstmaw83FuxeEfskMTVml0o8dbevQNE";

export const artistAgent = createClient(ARTIST_AGENT_URL, ARTIST_AGENT_ANON_KEY, {
  auth: {
    storageKey: 'artistagent-auth',
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const ARTIST_AGENT_FUNCTION_URL = ARTIST_AGENT_URL + '/functions/v1';
