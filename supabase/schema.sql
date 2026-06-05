-- =============================================
-- Rosewood Scents — Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Service role can manage profiles" on profiles using (true) with check (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Categories
create table if not exists categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text
);
alter table categories enable row level security;
create policy "Public read categories" on categories for select using (true);

-- Perfumes
create table if not exists perfumes (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null,
  image_url text,
  image_urls text[] default '{}',
  stock_quantity int not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz default now()
);
alter table perfumes enable row level security;
create policy "Public read perfumes" on perfumes for select using (true);
create policy "Admin manage perfumes" on perfumes using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Scent Notes
create table if not exists scent_notes (
  id serial primary key,
  name text not null,
  note_type text not null check (note_type in ('top', 'middle', 'base'))
);
alter table scent_notes enable row level security;
create policy "Public read scent notes" on scent_notes for select using (true);

-- Perfume ↔ Categories
create table if not exists perfume_categories (
  perfume_id int references perfumes on delete cascade,
  category_id int references categories on delete cascade,
  primary key (perfume_id, category_id)
);
alter table perfume_categories enable row level security;
create policy "Public read perfume_categories" on perfume_categories for select using (true);

-- Perfume ↔ Scent Notes
create table if not exists perfume_notes (
  perfume_id int references perfumes on delete cascade,
  note_id int references scent_notes on delete cascade,
  primary key (perfume_id, note_id)
);
alter table perfume_notes enable row level security;
create policy "Public read perfume_notes" on perfume_notes for select using (true);

-- Cart Items
create table if not exists cart_items (
  id serial primary key,
  user_id uuid references auth.users on delete cascade not null,
  perfume_id int references perfumes on delete cascade not null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique (user_id, perfume_id)
);
alter table cart_items enable row level security;
create policy "Users manage own cart" on cart_items using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User Favorites
create table if not exists user_favorites (
  user_id uuid references auth.users on delete cascade,
  perfume_id int references perfumes on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, perfume_id)
);
alter table user_favorites enable row level security;
create policy "Users manage own favorites" on user_favorites using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders
create table if not exists orders (
  id serial primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  total_amount numeric(10,2) not null,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_country text,
  stripe_session_id text,
  created_at timestamptz default now()
);
alter table orders enable row level security;
create policy "Users view own orders" on orders for select using (auth.uid() = user_id);
create policy "Service role manage orders" on orders using (true) with check (true);

-- Order Items
create table if not exists order_items (
  id serial primary key,
  order_id int references orders on delete cascade not null,
  perfume_id int references perfumes on delete cascade not null,
  quantity int not null,
  unit_price numeric(10,2) not null
);
alter table order_items enable row level security;
create policy "Users view own order items" on order_items for select
  using (exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "Service role manage order items" on order_items using (true) with check (true);
