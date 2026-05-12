-- Optional migration: track onboarding completion server-side.
-- The app currently uses AsyncStorage (works offline, no network round-trip).
-- Run this if you want onboarding state to follow users across devices.
--
-- The existing "profiles: user updates own" RLS policy already covers these fields.

alter table public.profiles
  add column if not exists onboarding_completed    boolean     not null default false,
  add column if not exists onboarding_completed_at timestamptz;

-- To switch from AsyncStorage to Supabase in App.js, replace the onboarding
-- useEffect and completeOnboarding function with:
--
-- Check:
--   const { data } = await supabase
--     .from('profiles')
--     .select('onboarding_completed')
--     .eq('id', user.uid)
--     .single();
--   setOnboardingDone(data?.onboarding_completed ?? false);
--
-- Complete:
--   await supabase.from('profiles').update({
--     onboarding_completed: true,
--     onboarding_completed_at: new Date().toISOString(),
--   }).eq('id', user.uid);
--   setOnboardingDone(true);
