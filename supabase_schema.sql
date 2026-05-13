-- Users table extending Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fitness Plans table to store generated routines & diets
create table public.fitness_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  goal text not null,
  duration_months integer not null,
  training_routine jsonb not null,
  diet_chart jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Meal Logs table to store daily tracking
create table public.meal_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.fitness_plans(id) on delete cascade not null,
  log_date date default CURRENT_DATE not null,
  meal_type text not null, -- e.g. "Breakfast", "Lunch"
  image_urls text[] not null, -- array of Supabase Storage URLs
  analysis text,
  is_match boolean,
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.fitness_plans enable row level security;
alter table public.meal_logs enable row level security;

-- Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own plans" on public.fitness_plans for select using (auth.uid() = user_id);
create policy "Users can insert own plans" on public.fitness_plans for insert with check (auth.uid() = user_id);

create policy "Users can view own meal logs" on public.meal_logs for select using (auth.uid() = user_id);
create policy "Users can insert own meal logs" on public.meal_logs for insert with check (auth.uid() = user_id);

-- Storage bucket for meal images
insert into storage.buckets (id, name, public) values ('meal_images', 'meal_images', true);
create policy "Users can upload meal images" on storage.objects for insert with check (bucket_id = 'meal_images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can view meal images" on storage.objects for select using (bucket_id = 'meal_images');
