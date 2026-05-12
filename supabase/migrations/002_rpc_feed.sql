-- Run this in the Supabase SQL editor after 001_init.sql
create or replace function public.get_feed(p_limit int default 50, p_offset int default 0)
returns table (
  gem_id        uuid,
  title         text,
  caption       text,
  category      text,
  mood_tags     text[],
  visibility    gem_visibility,
  like_count    int,
  save_count    int,
  comment_count int,
  created_at    timestamptz,
  author_id     uuid,
  author_handle text,
  author_name   text,
  author_avatar text,
  place_id      uuid,
  place_name    text,
  place_city    text,
  place_lat     double precision,
  place_lng     double precision,
  images        jsonb,
  is_liked      boolean,
  is_saved      boolean
)
language sql
security definer set search_path = public
as $$
  select
    g.id,
    g.title,
    g.caption,
    g.category,
    g.mood_tags,
    g.visibility,
    g.like_count,
    g.save_count,
    g.comment_count,
    g.created_at,
    p.id,
    p.handle,
    p.display_name,
    p.avatar_url,
    pl.id,
    pl.name,
    pl.city,
    pl.latitude,
    pl.longitude,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'storage_path', gi.storage_path,
          'order_index',  gi.order_index
        ) order by gi.order_index
      )
      from gem_images gi where gi.gem_id = g.id
    ), '[]'::jsonb),
    exists(select 1 from gem_likes gl where gl.gem_id = g.id and gl.user_id = auth.uid()),
    exists(select 1 from saves     s  where s.gem_id  = g.id and s.user_id  = auth.uid())
  from gems g
  join profiles p  on p.id  = g.author_id
  join places   pl on pl.id = g.place_id
  where
    g.visibility = 'public'
    or g.author_id = auth.uid()
    or (
      g.visibility = 'followers'
      and exists (
        select 1 from follows f
        where f.follower_id = auth.uid() and f.following_id = g.author_id
      )
    )
  order by g.created_at desc
  limit p_limit offset p_offset;
$$;
