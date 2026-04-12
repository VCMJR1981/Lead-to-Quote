-- ============================================
-- LEAD-TO-QUOTE — Database Schema v2
-- Run this in Supabase SQL Editor
-- ============================================

-- Businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  logo_url text,
  phone text,
  email text,
  website text,
  address text,
  tagline text,
  accent_color text default '#E85D26',
  industry text not null default 'handyman',
  country text not null default 'US',
  language text not null default 'en',
  currency text not null default 'USD',
  vat_registered boolean default false,
  vat_number text,
  vat_rate numeric default 0,
  bank_label text,
  bank_detail text,
  deposit_pct integer default 30,
  payment_methods text[] default '{bank,card}',
  -- Stripe Billing
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text default 'trialing'
    check (subscription_status in ('trialing','active','past_due','canceled','incomplete')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_end timestamptz,
  -- Stripe Connect
  stripe_connect_account_id text unique,
  stripe_connect_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  job_type text,
  description text,
  preferred_date date,
  status text default 'new' check (status in ('new','quoted','won','lost')),
  source text default 'form',
  viewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Quotes
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  quote_number text,
  sections jsonb default '[]'::jsonb,
  notes text,
  subtotal numeric default 0,
  tax_rate numeric default 0,
  tax_amount numeric default 0,
  stripe_fee numeric default 0,
  total numeric default 0,
  deposit_pct integer default 0,
  deposit_amount numeric default 0,
  payment_methods text[] default '{bank}',
  status text default 'draft'
    check (status in ('draft','sent','accepted','rejected')),
  is_invoice boolean default false,
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payments (client pays builder via Stripe Connect)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  amount numeric not null,
  currency text not null,
  type text check (type in ('deposit','balance','full')),
  status text default 'pending'
    check (status in ('pending','succeeded','failed','refunded')),
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.businesses enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.payments enable row level security;

create policy "Owner manages own business"
  on public.businesses for all using (auth.uid() = owner_id);

create policy "Public can read any business"
  on public.businesses for select using (true);

create policy "Owner manages leads"
  on public.leads for all
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "Public can insert leads"
  on public.leads for insert
  with check (business_id in (select id from public.businesses));

create policy "Public can update lead viewed_at"
  on public.leads for update using (true) with check (true);

create policy "Owner manages quotes"
  on public.quotes for all
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

create policy "Public can read sent quotes"
  on public.quotes for select
  using (status in ('sent','accepted','rejected'));

create policy "Public can accept quote"
  on public.quotes for update
  using (status = 'sent') with check (status = 'accepted');

create policy "Owner reads own payments"
  on public.payments for select
  using (business_id in (select id from public.businesses where owner_id = auth.uid()));

-- ============================================
-- updated_at triggers
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_businesses_updated_at
  before update on public.businesses for each row execute function update_updated_at();

create trigger trg_leads_updated_at
  before update on public.leads for each row execute function update_updated_at();

create trigger trg_quotes_updated_at
  before update on public.quotes for each row execute function update_updated_at();
