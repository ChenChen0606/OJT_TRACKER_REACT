# OJT Tracker (React + Supabase)

## Setup
1. Supabase dashboard -> **SQL Editor** -> paste `supabase/schema.sql` -> Run (once).
2. Supabase dashboard -> **Project Settings -> API** -> copy the **anon public** key into `.env` (`VITE_SUPABASE_ANON_KEY`).
   Never use the `service_role` key in this app.
3. For development: **Authentication -> Providers -> Email** -> turn off "Confirm email" (or confirm via the email link).
4. `npm install` then `npm run dev`.

Data lives only in Supabase. Row Level Security makes interns see only their own data and companies only their own interns.
