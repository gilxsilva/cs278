-- =============================================================================
-- gem — Supabase schema v1
-- Run this in the Supabase SQL editor (or via supabase db push)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";    -- fuzzy search

-- ---------------------------------------------------------------------------
-- Enums  (use text for category since it will grow; enum for stable fields)
-- ---------------------------------------------------------------------------
create type gem_visibility        as enum ('public', 'followers', 'private');
create type collection_visibility as enum ('public', 'private', 'shared');


-- =============================================================================
-- PROFILES
-- =============================================================================
create table public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  handle          text        not null unique,
  display_name    text        not null,
  avatar_url      text,                        -- Google OAuth URL or Supabase Storage URL
  bio             text,
  taste_tagline   text,                        -- "quiet corners, strong coffee"
  taste_tags      text[]      not null default '{}',
  follower_count  integer     not null default 0 check (follower_count  >= 0),
  following_count integer     not null default 0 check (following_count >= 0),
  gem_count       integer     not null default 0 check (gem_count       >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create a profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_handle text;
begin
  base_handle := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    base_handle,
    coalesce(new.raw_user_meta_data->>'full_name', base_handle),
    new.raw_user_meta_data->>'avatar_url'   -- null-safe; may be null for email/pass auth
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper (reused below)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- PLACES
-- =============================================================================
create table public.places (
  id                uuid        primary key default uuid_generate_v4(),
  name              text        not null,
  address           text,
  city              text,
  state             text,
  country           text        not null default 'US',
  latitude          double precision not null,
  longitude         double precision not null,
  category          text,                    -- coffee / food / study / hidden / events / etc.
  external_place_id text,                    -- future: Google Places ID
  created_by        uuid        references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);


-- =============================================================================
-- GEMS
-- =============================================================================
create table public.gems (
  id            uuid              primary key default uuid_generate_v4(),
  author_id     uuid              not null references public.profiles(id) on delete cascade,
  place_id      uuid              not null references public.places(id)   on delete restrict,
  title         text              not null,
  caption       text,
  category      text              not null,
  mood_tags     text[]            not null default '{}',
  visibility    gem_visibility    not null default 'public',
  like_count    integer           not null default 0 check (like_count    >= 0),
  save_count    integer           not null default 0 check (save_count    >= 0),
  comment_count integer           not null default 0 check (comment_count >= 0),
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now()
);

create trigger set_gems_updated_at
  before update on public.gems
  for each row execute function public.touch_updated_at();

-- Full-text search vector (generated, always in sync)
alter table public.gems
  add column search_vec tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,   '')), 'A') ||
    setweight(to_tsvector('english', coalesce(caption, '')), 'B')
  ) stored;

-- Maintain gem_count on profiles
create or replace function public.update_gem_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles set gem_count = gem_count + 1 where id = NEW.author_id;
  elsif (TG_OP = 'DELETE') then
    update public.profiles set gem_count = greatest(gem_count - 1, 0) where id = OLD.author_id;
  end if;
  return null;
end;
$$;

create trigger on_gem_change
  after insert or delete on public.gems
  for each row execute function public.update_gem_count();


-- =============================================================================
-- GEM IMAGES
-- =============================================================================
create table public.gem_images (
  id           uuid        primary key default uuid_generate_v4(),
  gem_id       uuid        not null references public.gems(id) on delete cascade,
  storage_path text        not null,   -- relative path inside bucket: "gem-images/uid/gem_id/001.jpg"
  order_index  smallint    not null default 0,
  alt_text     text,
  created_at   timestamptz not null default now()
);


-- =============================================================================
-- FOLLOWS
-- =============================================================================
create table public.follows (
  follower_id  uuid        not null references public.profiles(id) on delete cascade,
  following_id uuid        not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create or replace function public.update_follow_counts()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles set follower_count  = follower_count  + 1 where id = NEW.following_id;
    update public.profiles set following_count = following_count + 1 where id = NEW.follower_id;
  elsif (TG_OP = 'DELETE') then
    update public.profiles set follower_count  = greatest(follower_count  - 1, 0) where id = OLD.following_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = OLD.follower_id;
  end if;
  return null;
end;
$$;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute function public.update_follow_counts();


-- =============================================================================
-- GEM LIKES
-- =============================================================================
create table public.gem_likes (
  gem_id     uuid        not null references public.gems(id)     on delete cascade,
  user_id    uuid        not null references public.profiles(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gem_id, user_id)
);

create or replace function public.update_like_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.gems set like_count = like_count + 1 where id = NEW.gem_id;
  elsif (TG_OP = 'DELETE') then
    update public.gems set like_count = greatest(like_count - 1, 0) where id = OLD.gem_id;
  end if;
  return null;
end;
$$;

create trigger on_gem_like_change
  after insert or delete on public.gem_likes
  for each row execute function public.update_like_count();


-- =============================================================================
-- SAVES  (quick bookmark — drives save_count and the bookmark toggle)
-- =============================================================================
create table public.saves (
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  gem_id     uuid        not null references public.gems(id)     on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, gem_id)
);

create or replace function public.update_save_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.gems set save_count = save_count + 1 where id = NEW.gem_id;
  elsif (TG_OP = 'DELETE') then
    update public.gems set save_count = greatest(save_count - 1, 0) where id = OLD.gem_id;
  end if;
  return null;
end;
$$;

create trigger on_save_change
  after insert or delete on public.saves
  for each row execute function public.update_save_count();


-- =============================================================================
-- COMMENTS
-- =============================================================================
create table public.comments (
  id                uuid        primary key default uuid_generate_v4(),
  gem_id            uuid        not null references public.gems(id)     on delete cascade,
  author_id         uuid        not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid        references public.comments(id)          on delete cascade,
  body              text        not null check (length(trim(body)) > 0),
  deleted_at        timestamptz,                   -- soft delete; body shown as "[removed]" in UI
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger set_comments_updated_at
  before update on public.comments
  for each row execute function public.touch_updated_at();

create or replace function public.update_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT' and NEW.deleted_at is null and NEW.parent_comment_id is null) then
    -- only top-level comments count toward the badge
    update public.gems set comment_count = comment_count + 1 where id = NEW.gem_id;
  elsif (TG_OP = 'UPDATE' and OLD.deleted_at is null and NEW.deleted_at is not null
         and NEW.parent_comment_id is null) then
    update public.gems set comment_count = greatest(comment_count - 1, 0) where id = NEW.gem_id;
  end if;
  return null;
end;
$$;

create trigger on_comment_change
  after insert or update on public.comments
  for each row execute function public.update_comment_count();


-- =============================================================================
-- COLLECTIONS
-- =============================================================================
create table public.collections (
  id          uuid                  primary key default uuid_generate_v4(),
  owner_id    uuid                  not null references public.profiles(id) on delete cascade,
  name        text                  not null check (length(trim(name)) > 0),
  description text,
  visibility  collection_visibility not null default 'private',
  cover_path  text,                            -- storage path for cover image
  item_count  integer               not null default 0 check (item_count >= 0),
  created_at  timestamptz           not null default now(),
  updated_at  timestamptz           not null default now()
);

create trigger set_collections_updated_at
  before update on public.collections
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- COLLECTION ITEMS
-- =============================================================================
create table public.collection_items (
  id            uuid        primary key default uuid_generate_v4(),
  collection_id uuid        not null references public.collections(id) on delete cascade,
  gem_id        uuid        references public.gems(id)   on delete cascade,
  place_id      uuid        references public.places(id) on delete cascade,
  added_by      uuid        not null references public.profiles(id) on delete cascade,
  note          text,
  added_at      timestamptz not null default now(),
  -- at least one of gem_id or place_id must be set
  constraint item_has_content check (gem_id is not null or place_id is not null)
);

-- Prevent the same gem appearing twice in the same collection
create unique index idx_ci_gem_unique
  on public.collection_items (collection_id, gem_id)
  where gem_id is not null;

-- Prevent the same standalone place-save appearing twice in the same collection
create unique index idx_ci_place_unique
  on public.collection_items (collection_id, place_id)
  where place_id is not null and gem_id is null;

create or replace function public.update_collection_item_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.collections set item_count = item_count + 1 where id = NEW.collection_id;
  elsif (TG_OP = 'DELETE') then
    update public.collections set item_count = greatest(item_count - 1, 0) where id = OLD.collection_id;
  end if;
  return null;
end;
$$;

create trigger on_collection_item_change
  after insert or delete on public.collection_items
  for each row execute function public.update_collection_item_count();


-- =============================================================================
-- INDEXES
-- =============================================================================

-- Profiles
create index idx_profiles_handle        on public.profiles (handle);
create index idx_profiles_display_trgm  on public.profiles using gin (display_name gin_trgm_ops);
create index idx_profiles_handle_trgm   on public.profiles using gin (handle gin_trgm_ops);
create index idx_profiles_search        on public.profiles using gin (
  (  setweight(to_tsvector('simple', coalesce(display_name, '')), 'A')
  || setweight(to_tsvector('simple', coalesce(handle,        '')), 'A')
  || setweight(to_tsvector('english', coalesce(bio,          '')), 'B')
  )
);

-- Places
create index idx_places_location        on public.places (latitude, longitude);
create index idx_places_name_trgm       on public.places using gin (name gin_trgm_ops);
create index idx_places_created_by      on public.places (created_by);
create index idx_places_category        on public.places (category) where category is not null;

-- Gems
create index idx_gems_author            on public.gems (author_id);
create index idx_gems_place             on public.gems (place_id);
create index idx_gems_created_at        on public.gems (created_at desc);
create index idx_gems_category          on public.gems (category);
create index idx_gems_visibility        on public.gems (visibility);
create index idx_gems_public_feed       on public.gems (created_at desc) where visibility = 'public';
create index idx_gems_search            on public.gems using gin (search_vec);
create index idx_gems_title_trgm        on public.gems using gin (title gin_trgm_ops);

-- Gem images
create index idx_gem_images_gem         on public.gem_images (gem_id, order_index);

-- Follows
create index idx_follows_follower       on public.follows (follower_id);
create index idx_follows_following      on public.follows (following_id);

-- Likes
create index idx_gem_likes_gem          on public.gem_likes (gem_id);
create index idx_gem_likes_user         on public.gem_likes (user_id);

-- Saves
create index idx_saves_user             on public.saves (user_id);
create index idx_saves_gem              on public.saves (gem_id);

-- Comments
create index idx_comments_gem           on public.comments (gem_id) where deleted_at is null;
create index idx_comments_author        on public.comments (author_id);
create index idx_comments_parent        on public.comments (parent_comment_id)
  where parent_comment_id is not null;

-- Collections
create index idx_collections_owner      on public.collections (owner_id);
create index idx_collections_visibility on public.collections (visibility);

-- Collection items
create index idx_ci_collection          on public.collection_items (collection_id);
create index idx_ci_gem                 on public.collection_items (gem_id)   where gem_id   is not null;
create index idx_ci_place               on public.collection_items (place_id) where place_id is not null;


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles         enable row level security;
alter table public.places           enable row level security;
alter table public.gems             enable row level security;
alter table public.gem_images       enable row level security;
alter table public.follows          enable row level security;
alter table public.gem_likes        enable row level security;
alter table public.saves            enable row level security;
alter table public.comments         enable row level security;
alter table public.collections      enable row level security;
alter table public.collection_items enable row level security;

-- ─── profiles ────────────────────────────────────────────────────────────────
create policy "profiles: anyone can read"
  on public.profiles for select using (true);

create policy "profiles: user inserts own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: user updates own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── places ──────────────────────────────────────────────────────────────────
create policy "places: authenticated read"
  on public.places for select
  to authenticated using (true);

create policy "places: authenticated insert"
  on public.places for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "places: creator update"
  on public.places for update
  using (auth.uid() = created_by);

-- ─── gems ────────────────────────────────────────────────────────────────────
create policy "gems: read by visibility"
  on public.gems for select
  using (
    visibility = 'public'
    or auth.uid() = author_id
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows
        where follower_id = auth.uid() and following_id = gems.author_id
      )
    )
  );

create policy "gems: author insert"
  on public.gems for insert
  with check (auth.uid() = author_id);

create policy "gems: author update"
  on public.gems for update
  using (auth.uid() = author_id);

create policy "gems: author delete"
  on public.gems for delete
  using (auth.uid() = author_id);

-- ─── gem_images ──────────────────────────────────────────────────────────────
-- Images are readable by authenticated users; content-level gating is on gems.
-- For truly private gem images, move this to a signed URL model later.
create policy "gem_images: authenticated read"
  on public.gem_images for select
  to authenticated using (true);

create policy "gem_images: gem author insert"
  on public.gem_images for insert
  with check (
    exists (select 1 from public.gems where id = gem_id and author_id = auth.uid())
  );

create policy "gem_images: gem author delete"
  on public.gem_images for delete
  using (
    exists (select 1 from public.gems where id = gem_id and author_id = auth.uid())
  );

-- ─── follows ─────────────────────────────────────────────────────────────────
create policy "follows: authenticated read"
  on public.follows for select
  to authenticated using (true);

create policy "follows: user inserts own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows: user deletes own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ─── gem_likes ───────────────────────────────────────────────────────────────
create policy "gem_likes: authenticated read"
  on public.gem_likes for select
  to authenticated using (true);

create policy "gem_likes: user inserts own"
  on public.gem_likes for insert
  with check (auth.uid() = user_id);

create policy "gem_likes: user deletes own"
  on public.gem_likes for delete
  using (auth.uid() = user_id);

-- ─── saves ───────────────────────────────────────────────────────────────────
create policy "saves: user reads own"
  on public.saves for select
  using (auth.uid() = user_id);

create policy "saves: user inserts own"
  on public.saves for insert
  with check (auth.uid() = user_id);

create policy "saves: user deletes own"
  on public.saves for delete
  using (auth.uid() = user_id);

-- ─── comments ────────────────────────────────────────────────────────────────
create policy "comments: read on visible gems"
  on public.comments for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.gems g
      where g.id = gem_id
        and (
          g.visibility = 'public'
          or g.author_id = auth.uid()
          or (
            g.visibility = 'followers'
            and exists (
              select 1 from public.follows
              where follower_id = auth.uid() and following_id = g.author_id
            )
          )
        )
    )
  );

create policy "comments: authenticated insert as self"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "comments: author soft-delete"
  on public.comments for update
  using (auth.uid() = author_id);

-- ─── collections ─────────────────────────────────────────────────────────────
create policy "collections: read public/shared or own"
  on public.collections for select
  using (
    visibility in ('public', 'shared')
    or auth.uid() = owner_id
  );

create policy "collections: user inserts own"
  on public.collections for insert
  with check (auth.uid() = owner_id);

create policy "collections: owner update"
  on public.collections for update
  using (auth.uid() = owner_id);

create policy "collections: owner delete"
  on public.collections for delete
  using (auth.uid() = owner_id);

-- ─── collection_items ────────────────────────────────────────────────────────
create policy "collection_items: read based on collection visibility"
  on public.collection_items for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.visibility in ('public', 'shared') or c.owner_id = auth.uid())
    )
  );

create policy "collection_items: collection owner insert"
  on public.collection_items for insert
  with check (
    auth.uid() = added_by
    and exists (
      select 1 from public.collections
      where id = collection_id and owner_id = auth.uid()
    )
  );

create policy "collection_items: collection owner delete"
  on public.collection_items for delete
  using (
    exists (
      select 1 from public.collections
      where id = collection_id and owner_id = auth.uid()
    )
  );
