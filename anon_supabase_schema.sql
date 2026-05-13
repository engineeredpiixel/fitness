-- FIRST: Drop the old tables if they exist to avoid conflicts
drop table if exists public.meal_logs cascade;
drop table if exists public.fitness_plans cascade;
drop table if exists public.profiles cascade;

-- Fitness Plans table (Anonymous)
create table public.fitness_plans (
  id uuid default uuid_generate_v4() primary key,
  local_user_id text not null, -- Stores the browser's localStorage ID
  goal text not null,
  duration_months text not null,
  training_routine jsonb not null,
  diet_chart jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Meal Logs table (Anonymous)
create table public.meal_logs (
  id uuid default uuid_generate_v4() primary key,
  local_user_id text not null,
  plan_id uuid references public.fitness_plans(id) on delete cascade,
  log_date date default CURRENT_DATE not null,
  meal_type text not null,
  image_urls text[], -- optional, since base64 strings are too large for simple text columns, but we can store them if needed. For now, we will store analysis.
  analysis text,
  is_match boolean,
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.fitness_plans enable row level security;
alter table public.meal_logs enable row level security;

-- Since we are not using Auth, we allow anon (public) access for now. 
-- In a real production without auth, you can restrict by IP or use edge functions, but for this MVP, anon read/write is required.
create policy "Allow anonymous inserts" on public.fitness_plans for insert with check (true);
create policy "Allow anonymous selects" on public.fitness_plans for select using (true);

create policy "Allow anonymous inserts" on public.meal_logs for insert with check (true);
create policy "Allow anonymous selects" on public.meal_logs for select using (true);
