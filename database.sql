-- ============================================================
-- Regex Challenge Game — Supabase Database Schema & Seed Data
-- ============================================================
-- Run this entire file in the Supabase SQL Editor
-- (Project -> SQL Editor -> New Query -> paste -> Run)
-- ============================================================

-- ------------------------------------------------------------
-- Clean slate (safe to re-run)
-- ------------------------------------------------------------
drop table if exists public.leaderboard cascade;
drop table if exists public.regex_challenges cascade;
drop table if exists public.categories cascade;

-- ------------------------------------------------------------
-- Table: categories
-- ------------------------------------------------------------
create table public.categories (
  id             bigint generated always as identity primary key,
  slug           text not null unique,
  name           text not null,
  description    text not null,
  icon           text not null,            -- lucide icon name
  difficulty     text not null check (difficulty in ('Beginner','Easy','Medium','Hard','Expert')),
  display_order  int not null unique
);

-- ------------------------------------------------------------
-- Table: regex_challenges
-- ------------------------------------------------------------
create table public.regex_challenges (
  id              bigint generated always as identity primary key,
  category_id     bigint not null references public.categories(id) on delete cascade,
  regex_pattern   text not null,
  description     text not null,
  example_answer  text not null,
  difficulty      text not null check (difficulty in ('Beginner','Easy','Medium','Hard','Expert')),
  points          int not null default 10,
  display_order   int not null default 0
);

create index idx_challenges_category on public.regex_challenges(category_id);

-- ------------------------------------------------------------
-- Table: leaderboard
-- ------------------------------------------------------------
create table public.leaderboard (
  id                bigint generated always as identity primary key,
  username          text not null unique check (char_length(username) between 1 and 20),
  score             int not null default 0,
  accuracy          numeric(5,2) not null default 0,
  completion_time   int not null default 0,   -- seconds, cumulative across games
  games_played      int not null default 0,
  completed_at      timestamptz not null default now()
);

create index idx_leaderboard_score on public.leaderboard(score desc);
create unique index idx_leaderboard_username on public.leaderboard(lower(username));

-- ------------------------------------------------------------
-- Row Level Security
-- Public, no-auth game: allow anonymous read on categories &
-- challenges, and allow anonymous insert + read on leaderboard.
-- ------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.regex_challenges enable row level security;
alter table public.leaderboard enable row level security;

create policy "Public can read categories"
  on public.categories for select
  using (true);

create policy "Public can read challenges"
  on public.regex_challenges for select
  using (true);

create policy "Public can read leaderboard"
  on public.leaderboard for select
  using (true);

create policy "Public can insert leaderboard entries"
  on public.leaderboard for insert
  with check (true);

create policy "Public can update leaderboard entries"
  on public.leaderboard for update
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- Function: upsert_leaderboard_score
-- Tallies (accumulates) a player's score under their username.
-- If the username already has a leaderboard row, the new score
-- is ADDED to their running total (and games_played incremented);
-- otherwise a new row is created. This guarantees one row per
-- username with a running, tallied score.
-- ------------------------------------------------------------
create or replace function public.upsert_leaderboard_score(
  p_username        text,
  p_score_delta     int,
  p_accuracy        numeric,
  p_completion_time int,
  p_count_game      boolean default true
) returns public.leaderboard
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.leaderboard;
begin
  insert into public.leaderboard (username, score, accuracy, completion_time, games_played, completed_at)
  values (p_username, p_score_delta, p_accuracy, p_completion_time, case when p_count_game then 1 else 0 end, now())
  on conflict (lower(username)) do update
    set score           = public.leaderboard.score + excluded.score,
        accuracy         = p_accuracy,
        completion_time  = public.leaderboard.completion_time + excluded.completion_time,
        games_played     = public.leaderboard.games_played + (case when p_count_game then 1 else 0 end),
        completed_at     = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.upsert_leaderboard_score(text, int, numeric, int, boolean) to anon, authenticated;

-- ============================================================
-- SEED: Categories (unlock order == display_order)
-- ============================================================
insert into public.categories (slug, name, description, icon, difficulty, display_order) values
('numbers',       'Numbers',       'Match digits, integers, decimals and numeric patterns.',        'hash',        'Beginner', 1),
('letters',       'Letters',       'Match alphabetic characters and word-based patterns.',          'type',        'Easy',     2),
('dates',         'Dates',         'Match calendar dates in various formats.',                      'calendar',    'Easy',     3),
('passwords',     'Passwords',     'Match strong password rules and character requirements.',       'lock',        'Medium',   4),
('emails',        'Emails',        'Match valid email address formats.',                            'mail',        'Medium',   5),
('urls',          'URLs',          'Match website links and URL structures.',                       'globe',       'Hard',     6),
('phone-numbers', 'Phone Numbers', 'Match phone numbers in different regional formats.',             'smartphone',  'Expert',   7);

-- ============================================================
-- SEED: Regex Challenges
-- ============================================================

-- ---------------- NUMBERS (category_id 1) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(1, '^\d+$',                       'Enter a string made of one or more digits only.',                         '42',        'Beginner', 10, 1),
(1, '^-?\d+$',                     'Enter a positive or negative whole number (integer).',                    '-17',       'Beginner', 10, 2),
(1, '^\d{3}$',                     'Enter exactly three digits.',                                              '507',       'Beginner', 10, 3),
(1, '^\d+\.\d{2}$',                'Enter a decimal number with exactly two digits after the point.',         '19.99',     'Easy',     15, 4),
(1, '^[1-9]\d*$',                  'Enter a positive number with no leading zero.',                           '128',       'Easy',     15, 5),
(1, '^\d{1,3}(,\d{3})*$',          'Enter a number formatted with comma thousand separators.',                '1,234,567', 'Medium',   20, 6);

-- ---------------- LETTERS (category_id 2) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(2, '^[a-zA-Z]+$',                 'Enter a string made only of letters (upper or lower case).',              'Hello',     'Beginner', 10, 1),
(2, '^[a-z]+$',                    'Enter a string made only of lowercase letters.',                          'regex',     'Beginner', 10, 2),
(2, '^[A-Z]{3}$',                  'Enter exactly three uppercase letters.',                                  'ABC',       'Beginner', 10, 3),
(2, '^[A-Z][a-z]+$',               'Enter a capitalized word: one uppercase letter followed by lowercase letters.', 'Regex', 'Easy', 15, 4),
(2, '^[a-zA-Z]{2,}\s[a-zA-Z]{2,}$','Enter a first and last name separated by a single space.',                'Ada Lovelace','Medium', 20, 5);

-- ---------------- DATES (category_id 3) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(3, '^\d{4}-\d{2}-\d{2}$',                          'Enter a date in ISO format YYYY-MM-DD.',                 '2024-06-15', 'Easy',   15, 1),
(3, '^\d{2}/\d{2}/\d{4}$',                          'Enter a date in MM/DD/YYYY format.',                     '06/15/2024', 'Easy',   15, 2),
(3, '^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$','Enter a valid date as DD-MM-YYYY (valid day/month ranges).','15-06-2024','Medium', 20, 3),
(3, '^\d{4}/(0[1-9]|1[0-2])$',                      'Enter a year and month in YYYY/MM format.',              '2024/06',    'Medium', 20, 4),
(3, '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} \w{3} \d{4}$', 'Enter a date like "Sat, 15 Jun 2024" (3-letter weekday, day, 3-letter month, year).', 'Sat, 15 Jun 2024', 'Hard', 25, 5);

-- ---------------- PASSWORDS (category_id 4) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(4, '^.{8,}$',                                                    'Enter a password of at least 8 characters (any characters).', 'mypassword', 'Easy', 15, 1),
(4, '^(?=.*[A-Z]).{6,}$',                                         'Enter a password of at least 6 characters containing at least one uppercase letter.', 'Passw0', 'Medium', 20, 2),
(4, '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$',                      'Enter a password (8+ chars) with at least one lowercase, one uppercase and one digit.', 'Str0ngPass', 'Hard', 25, 3),
(4, '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{10,}$',     'Enter a strong password (10+ chars) with lower, upper, digit and special character.', 'Sup3rSafe!Pw', 'Expert', 30, 4),
(4, '^\S{6,}$',                                                   'Enter a password of at least 6 characters with no whitespace.', 'noSpaces1', 'Medium', 20, 5);

-- ---------------- EMAILS (category_id 5) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(5, '^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$',                       'Enter a simple email address (letters/numbers, one @, a domain and extension).', 'user@example.com', 'Medium', 20, 1),
(5, '^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$',                                 'Enter an email that may include dots, plus signs or hyphens before the @.', 'first.last+tag@mail-server.com', 'Medium', 20, 2),
(5, '^[\w.]+@gmail\.com$',                                             'Enter a Gmail address specifically (must end in @gmail.com).', 'jane.doe@gmail.com', 'Easy', 15, 3),
(5, '^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$',                'Enter an email whose domain may have a country suffix, e.g. .co.uk.', 'contact@company.co.uk', 'Hard', 25, 4),
(5, '^[a-zA-Z0-9._%+-]+@(yahoo|hotmail|outlook)\.com$',                'Enter an email from yahoo.com, hotmail.com, or outlook.com only.', 'someone@outlook.com', 'Hard', 25, 5);

-- ---------------- URLS (category_id 6) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(6, '^https?://[\w.-]+\.[a-zA-Z]{2,}$',                                'Enter a basic URL starting with http:// or https://.', 'https://example.com', 'Medium', 20, 1),
(6, '^https://[\w.-]+\.[a-zA-Z]{2,}$',                                 'Enter a secure URL that must start with https://.', 'https://secure-site.com', 'Medium', 20, 2),
(6, '^https?://(www\.)?[\w.-]+\.[a-zA-Z]{2,}(/\S*)?$',                 'Enter a URL that may optionally include "www." and a path after the domain.', 'https://www.example.com/path/page', 'Hard', 25, 3),
(6, '^https?://[\w.-]+\.[a-zA-Z]{2,}(:\d+)?(/\S*)?$',                  'Enter a URL that may optionally include a port number, e.g. :8080.', 'http://localhost:8080/api', 'Hard', 25, 4),
(6, '^https?://[\w.-]+\.[a-zA-Z]{2,}/\S+\?\S+=\S+$',                   'Enter a URL that includes a path and at least one query parameter (key=value).', 'https://example.com/search?q=regex', 'Expert', 30, 5);

-- ---------------- PHONE NUMBERS (category_id 7) ----------------
insert into public.regex_challenges (category_id, regex_pattern, description, example_answer, difficulty, points, display_order) values
(7, '^\d{3}-\d{3}-\d{4}$',                     'Enter a US-style phone number in the format XXX-XXX-XXXX.',            '555-123-4567',    'Medium', 20, 1),
(7, '^\(\d{3}\) \d{3}-\d{4}$',                 'Enter a phone number formatted as (XXX) XXX-XXXX.',                    '(555) 123-4567',  'Medium', 20, 2),
(7, '^\+\d{1,3} \d{3} \d{3} \d{4}$',           'Enter an international phone number with a country code, e.g. +1 555 123 4567.', '+1 555 123 4567', 'Hard', 25, 3),
(7, '^\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$', 'Enter a phone number that may use spaces, dots, or dashes as separators, with an optional country code.', '+63.917.123.4567', 'Expert', 30, 4),
(7, '^\d{5}$',                                 'Enter a 5-digit short code / extension number.',                       '12345',           'Easy',   15, 5);
