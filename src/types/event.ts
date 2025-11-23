export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string; // ISO date string
  event_url?: string; // Optional URL for event registration/info
  flyer_url?: string; // URL to PDF flyer in Supabase storage
  created_at: string;
  created_by: string; // User ID who created the event
}

