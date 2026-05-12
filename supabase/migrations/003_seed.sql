-- =============================================================================
-- 003_seed.sql — Demo seed data for gem app
-- Run in Supabase SQL Editor (service_role bypasses RLS)
-- Safe to re-run: ON CONFLICT DO NOTHING everywhere
--
-- UUID key:
--   Users   a1000000…001 (eva) … a8000000…008 (sofia)
--   Gil     f594d26c-9dc8-46ce-9589-9b56aed27adf  (real auth user)
--   Places  b1000000-0000-0000-0000-0000000000NN  (001–033)
--   Gems    c1000000-0000-0000-0000-0000000000NN  (001–045)
--   Colls   d1000000-0000-0000-0000-0000000000NN  (001–013)
--   Items   f1000000-0000-0000-0000-0000000000NN  (001–063)
--   Cmnts   e1000000-0000-0000-0000-0000000000NN  (001–070)
-- =============================================================================


-- =============================================================================
-- 1. FAKE AUTH USERS
-- handle_new_user trigger fires per row → creates profile automatically.
-- Each UUID starts with a different hex prefix so substr(1,8) is unique:
--   eva → user_a1000000, yujen → user_a2000000, … sofia → user_a8000000
-- =============================================================================
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  is_super_admin, is_sso_user
) VALUES
  ('00000000-0000-0000-0000-000000000000',
   'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'eva@gem-demo.app', '', now() - interval '85 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Eva Chen","avatar_url":"https://picsum.photos/seed/evachen/200/200"}'::jsonb,
   now()-interval'85 days', now()-interval'85 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a2000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'yujen@gem-demo.app', '', now() - interval '80 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Yu-Jen Lin","avatar_url":"https://picsum.photos/seed/yujenlin/200/200"}'::jsonb,
   now()-interval'80 days', now()-interval'80 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a3000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'alex@gem-demo.app', '', now() - interval '75 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Alex Rivera","avatar_url":"https://picsum.photos/seed/alexrivera/200/200"}'::jsonb,
   now()-interval'75 days', now()-interval'75 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a4000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'priya@gem-demo.app', '', now() - interval '70 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Priya Patel","avatar_url":"https://picsum.photos/seed/priyapatel/200/200"}'::jsonb,
   now()-interval'70 days', now()-interval'70 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a5000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'jordan@gem-demo.app', '', now() - interval '65 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Jordan Kim","avatar_url":"https://picsum.photos/seed/jordankim/200/200"}'::jsonb,
   now()-interval'65 days', now()-interval'65 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a6000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
   'maya@gem-demo.app', '', now() - interval '60 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Maya Okonkwo","avatar_url":"https://picsum.photos/seed/mayaokonkwo/200/200"}'::jsonb,
   now()-interval'60 days', now()-interval'60 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a7000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
   'kai@gem-demo.app', '', now() - interval '55 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Kai Nakamura","avatar_url":"https://picsum.photos/seed/kainakamura/200/200"}'::jsonb,
   now()-interval'55 days', now()-interval'55 days', '', '', '', '', false, false),

  ('00000000-0000-0000-0000-000000000000',
   'a8000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
   'sofia@gem-demo.app', '', now() - interval '50 days',
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Sofia Martínez","avatar_url":"https://picsum.photos/seed/sofiamartinez/200/200"}'::jsonb,
   now()-interval'50 days', now()-interval'50 days', '', '', '', '', false, false)

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 2. PROFILE ENRICHMENT
-- Trigger created the rows; we update handle/bio/taste fields here.
-- =============================================================================
UPDATE public.profiles SET
  handle        = 'gilsilva',
  display_name  = 'Gil Silva',
  bio           = 'CS278 @ Stanford. building things. finding spots.',
  taste_tagline = 'the real ones, not the algorithm ones',
  taste_tags    = ARRAY['hidden','local','walkable','coffee','outdoor']
WHERE id = 'f594d26c-9dc8-46ce-9589-9b56aed27adf';

UPDATE public.profiles SET
  handle        = 'evachen',
  display_name  = 'Eva Chen',
  avatar_url    = 'https://picsum.photos/seed/evachen/200/200',
  bio           = 'SF native. photography, coffee, and places that feel like a secret.',
  taste_tagline = 'quiet corners with good light',
  taste_tags    = ARRAY['aesthetic','hidden','calm','coffee','solo']
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE public.profiles SET
  handle        = 'yujenlin',
  display_name  = 'Yu-Jen Lin',
  avatar_url    = 'https://picsum.photos/seed/yujenlin/200/200',
  bio           = 'food researcher turned grad student. always eating.',
  taste_tagline = 'ordered the whole menu so you don''t have to',
  taste_tags    = ARRAY['foodie','local','affordable','brunch','trendy']
WHERE id = 'a2000000-0000-0000-0000-000000000002';

UPDATE public.profiles SET
  handle        = 'alexrivera',
  display_name  = 'Alex Rivera',
  avatar_url    = 'https://picsum.photos/seed/alexrivera/200/200',
  bio           = 'outdoors enjoyer. urban wilderness hunter. Stanford ME.',
  taste_tagline = 'nature hiding inside the city',
  taste_tags    = ARRAY['hidden','scenic','outdoor','solo','sunrise']
WHERE id = 'a3000000-0000-0000-0000-000000000003';

UPDATE public.profiles SET
  handle        = 'priyapatel',
  display_name  = 'Priya Patel',
  avatar_url    = 'https://picsum.photos/seed/priyapatel/200/200',
  bio           = 'studying, caffeinating, repeat. CS + HCI.',
  taste_tagline = 'good wifi is a personality',
  taste_tags    = ARRAY['quiet','focus','coffee','cozy','walkable']
WHERE id = 'a4000000-0000-0000-0000-000000000004';

UPDATE public.profiles SET
  handle        = 'jordankim',
  display_name  = 'Jordan Kim',
  avatar_url    = 'https://picsum.photos/seed/jordankim/200/200',
  bio           = 'I just like going out. venue scout at heart.',
  taste_tagline = 'every good night starts with the right spot',
  taste_tags    = ARRAY['lively','date-night','social','trendy','foodie']
WHERE id = 'a5000000-0000-0000-0000-000000000005';

UPDATE public.profiles SET
  handle        = 'mayaokonkwo',
  display_name  = 'Maya Okonkwo',
  avatar_url    = 'https://picsum.photos/seed/mayaokonkwo/200/200',
  bio           = 'Sunday markets, farmers markets, and the occasional weekday market.',
  taste_tagline = 'local first, always',
  taste_tags    = ARRAY['local','brunch','social','weekend','affordable']
WHERE id = 'a6000000-0000-0000-0000-000000000006';

UPDATE public.profiles SET
  handle        = 'kainakamura',
  display_name  = 'Kai Nakamura',
  avatar_url    = 'https://picsum.photos/seed/kainakamura/200/200',
  bio           = 'neighborhood explorer. one coffee shop per block.',
  taste_tagline = 'the block you live on has a gem, I promise',
  taste_tags    = ARRAY['local','coffee','walkable','cozy','hidden']
WHERE id = 'a7000000-0000-0000-0000-000000000007';

UPDATE public.profiles SET
  handle        = 'sofiamartinez',
  display_name  = 'Sofia Martínez',
  avatar_url    = 'https://picsum.photos/seed/sofiamartinez/200/200',
  bio           = 'architect by training. caffeinated by necessity.',
  taste_tagline = 'beauty in the details, coffee in hand',
  taste_tags    = ARRAY['aesthetic','artsy','coffee','calm','scenic']
WHERE id = 'a8000000-0000-0000-0000-000000000008';


-- =============================================================================
-- 3. PLACES  (33 new + existing Coupa Café 424fd190-… stays as-is)
-- =============================================================================
INSERT INTO public.places
  (id, name, address, city, state, latitude, longitude, category, created_by)
VALUES
-- Stanford campus
('b1000000-0000-0000-0000-000000000001','The Coffee House (CoHo)','Tressider Memorial Union','Stanford','CA',37.4248,-122.1701,'coffee','a4000000-0000-0000-0000-000000000004'),
('b1000000-0000-0000-0000-000000000002','Green Library','Green Library, Stanford University','Stanford','CA',37.4264,-122.1673,'study','a4000000-0000-0000-0000-000000000004'),
('b1000000-0000-0000-0000-000000000003','Memorial Church','Main Quad, Stanford University','Stanford','CA',37.4268,-122.1682,'hidden','a8000000-0000-0000-0000-000000000008'),
('b1000000-0000-0000-0000-000000000004','Frost Amphitheater','Frost Amphitheater, Stanford','Stanford','CA',37.4338,-122.1698,'events','a5000000-0000-0000-0000-000000000005'),
('b1000000-0000-0000-0000-000000000005','The Dish Trail','Stanford Foothills','Stanford','CA',37.4186,-122.1813,'hidden','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
('b1000000-0000-0000-0000-000000000006','Cantor Arts Center','328 Lomita Dr, Stanford','Stanford','CA',37.4293,-122.1680,'entertainment','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
('b1000000-0000-0000-0000-000000000007','Main Quad','Main Quadrangle, Stanford University','Stanford','CA',37.4273,-122.1679,'study','a4000000-0000-0000-0000-000000000004'),
('b1000000-0000-0000-0000-000000000008','Roble Arts Gym','Roble Hall, Stanford University','Stanford','CA',37.4232,-122.1700,'entertainment','a5000000-0000-0000-0000-000000000005'),
('b1000000-0000-0000-0000-000000000009','Tressider Union','459 Lagunita Dr, Stanford','Stanford','CA',37.4247,-122.1695,'food','a4000000-0000-0000-0000-000000000004'),
('b1000000-0000-0000-0000-000000000010','Escondido Village Garden','Escondido Village, Stanford','Stanford','CA',37.4198,-122.1754,'hidden','a3000000-0000-0000-0000-000000000003'),

-- Palo Alto
('b1000000-0000-0000-0000-000000000011','Philz Coffee','521 S California Ave, Palo Alto','Palo Alto','CA',37.4267,-122.1436,'coffee','a8000000-0000-0000-0000-000000000008'),
('b1000000-0000-0000-0000-000000000012','Bird Dog','420 Ramona St, Palo Alto','Palo Alto','CA',37.4457,-122.1594,'food','a5000000-0000-0000-0000-000000000005'),
('b1000000-0000-0000-0000-000000000013','Evvia Estiatorio','420 Emerson St, Palo Alto','Palo Alto','CA',37.4469,-122.1614,'food','a5000000-0000-0000-0000-000000000005'),
('b1000000-0000-0000-0000-000000000014','Boba Guys','441 Emerson St, Palo Alto','Palo Alto','CA',37.4467,-122.1592,'coffee','a2000000-0000-0000-0000-000000000002'),
('b1000000-0000-0000-0000-000000000015','Palo Alto Farmers Market','Lytton Ave & Gilman St, Palo Alto','Palo Alto','CA',37.4451,-122.1607,'events','a6000000-0000-0000-0000-000000000006'),
('b1000000-0000-0000-0000-000000000016','Peninsula Creamery','900 High St, Palo Alto','Palo Alto','CA',37.4438,-122.1612,'food','a2000000-0000-0000-0000-000000000002'),
('b1000000-0000-0000-0000-000000000017','Oren''s Hummus','261 University Ave, Palo Alto','Palo Alto','CA',37.4460,-122.1597,'food','a2000000-0000-0000-0000-000000000002'),
('b1000000-0000-0000-0000-000000000018','Mayfield Bakery & Cafe','855 El Camino Real, Palo Alto','Palo Alto','CA',37.4167,-122.1124,'coffee','a6000000-0000-0000-0000-000000000006'),
('b1000000-0000-0000-0000-000000000019','The Stanford Theatre','221 University Ave, Palo Alto','Palo Alto','CA',37.4443,-122.1611,'entertainment','a5000000-0000-0000-0000-000000000005'),
('b1000000-0000-0000-0000-000000000020','Rinconada Park','777 Embarcadero Rd, Palo Alto','Palo Alto','CA',37.4306,-122.1318,'hidden','a3000000-0000-0000-0000-000000000003'),
('b1000000-0000-0000-0000-000000000021','King Street Coffee','2727 Louis Rd, Palo Alto','Palo Alto','CA',37.4395,-122.1488,'coffee','a7000000-0000-0000-0000-000000000007'),
('b1000000-0000-0000-0000-000000000022','Café Venetia','271 University Ave, Palo Alto','Palo Alto','CA',37.4468,-122.1617,'coffee','a4000000-0000-0000-0000-000000000004'),

-- San Francisco
('b1000000-0000-0000-0000-000000000023','Tartine Bakery','600 Guerrero St, San Francisco','San Francisco','CA',37.7614,-122.4241,'food','a1000000-0000-0000-0000-000000000001'),
('b1000000-0000-0000-0000-000000000024','Blue Bottle Coffee','66 Mint St, San Francisco','San Francisco','CA',37.7774,-122.4073,'coffee','a1000000-0000-0000-0000-000000000001'),
('b1000000-0000-0000-0000-000000000025','Bi-Rite Creamery','3692 18th St, San Francisco','San Francisco','CA',37.7607,-122.4239,'food','a6000000-0000-0000-0000-000000000006'),
('b1000000-0000-0000-0000-000000000026','Dolores Park','Dolores St & 18th St, San Francisco','San Francisco','CA',37.7596,-122.4269,'hidden','a1000000-0000-0000-0000-000000000001'),
('b1000000-0000-0000-0000-000000000027','Lands End Lookout','680 Point Lobos Ave, San Francisco','San Francisco','CA',37.7834,-122.5080,'hidden','a1000000-0000-0000-0000-000000000001'),
('b1000000-0000-0000-0000-000000000028','The Mill','736 Divisadero St, San Francisco','San Francisco','CA',37.7779,-122.4352,'coffee','a8000000-0000-0000-0000-000000000008'),
('b1000000-0000-0000-0000-000000000029','Flour + Water','2401 Harrison St, San Francisco','San Francisco','CA',37.7593,-122.4162,'food','a2000000-0000-0000-0000-000000000002'),
('b1000000-0000-0000-0000-000000000030','GG Park Botanical Garden','Golden Gate Park, San Francisco','San Francisco','CA',37.7673,-122.4701,'hidden','a3000000-0000-0000-0000-000000000003'),
('b1000000-0000-0000-0000-000000000031','Sutro Baths','1004 Point Lobos Ave, San Francisco','San Francisco','CA',37.7799,-122.5118,'hidden','a3000000-0000-0000-0000-000000000003'),
('b1000000-0000-0000-0000-000000000032','Fort Mason Farmers Market','2 Marina Blvd, San Francisco','San Francisco','CA',37.8054,-122.4316,'events','a6000000-0000-0000-0000-000000000006'),
('b1000000-0000-0000-0000-000000000033','Alamo Square Park','701 Steiner St, San Francisco','San Francisco','CA',37.7762,-122.4356,'hidden','a6000000-0000-0000-0000-000000000006')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 4. GEMS  (45 gems across 9 authors)
-- category must be: study | food | coffee | events | hidden | entertainment
-- =============================================================================
INSERT INTO public.gems
  (id, author_id, place_id, title, caption, category, mood_tags, visibility, created_at)
VALUES

-- Gil (2 gems)
('c1000000-0000-0000-0000-000000000001','f594d26c-9dc8-46ce-9589-9b56aed27adf','b1000000-0000-0000-0000-000000000005',
 'Dawn on the Dish','quiet at dawn before the joggers arrive. bring a layer.',
 'hidden',ARRAY['sunrise','solo','scenic','calm'],'public', now()-interval'12 days'),

('c1000000-0000-0000-0000-000000000002','f594d26c-9dc8-46ce-9589-9b56aed27adf','b1000000-0000-0000-0000-000000000006',
 'Cantor on a Sunday','free on Sundays and somehow always empty. Rodin garden out back.',
 'entertainment',ARRAY['artsy','calm','solo','aesthetic'],'public', now()-interval'28 days'),

-- Eva (6 gems)
('c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000023',
 'Tartine Morning Bun','the morning bun is worth waiting in line. go before 9.',
 'food',ARRAY['brunch','local','cozy','foodie'],'public', now()-interval'3 days'),

('c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000024',
 'Blue Bottle Mint Plaza','best cortado in the city. the outdoor seating in morning sun is everything.',
 'coffee',ARRAY['aesthetic','calm','solo','scenic'],'public', now()-interval'18 days'),

('c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000026',
 'Dolores Park Secret Corner','the corner by the tennis courts nobody talks about. show up before 10am.',
 'hidden',ARRAY['hidden','local','calm','weekend'],'public', now()-interval'9 days'),

('c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000027',
 'Lands End at Dusk','GG bridge view at sunset. no crowds on Tuesday evenings.',
 'hidden',ARRAY['scenic','solo','sunset','hidden'],'public', now()-interval'22 days'),

('c1000000-0000-0000-0000-000000000040','a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000028',
 'The Mill Slow Morning','thick toast, slow morning, good wifi. order the Josey Baker.',
 'coffee',ARRAY['cozy','focus','aesthetic','calm'],'public', now()-interval'35 days'),

('c1000000-0000-0000-0000-000000000041','a1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000018',
 'Mayfield Almond Croissant','set an alarm. sold out by 9:30 on weekends. worth the drive.',
 'food',ARRAY['brunch','foodie','weekend','local'],'followers', now()-interval'44 days'),

-- Yu-Jen (5 gems)
('c1000000-0000-0000-0000-000000000007','a2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000029',
 'Flour + Water Pasta Tasting','their pasta tasting menu changed how I think about food. make a reservation.',
 'food',ARRAY['foodie','date-night','trendy','social'],'public', now()-interval'6 days'),

('c1000000-0000-0000-0000-000000000008','a2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000014',
 'Boba Guys Brown Sugar Milk Tea','the brown sugar milk tea is understated. trust the house order.',
 'coffee',ARRAY['local','cozy','affordable','walkable'],'public', now()-interval'14 days'),

('c1000000-0000-0000-0000-000000000009','a2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000017',
 'Oren''s Hummus','better than anything I had in Tel Aviv. impossible but true.',
 'food',ARRAY['foodie','affordable','local','brunch'],'public', now()-interval'31 days'),

('c1000000-0000-0000-0000-000000000010','a2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000016',
 'Peninsula Creamery Chocolate Malt','the chocolate malt shake. nothing else needs to be said.',
 'food',ARRAY['cozy','local','affordable','weekend'],'public', now()-interval'48 days'),

('c1000000-0000-0000-0000-000000000042','a2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000012',
 'Bird Dog Duck Fat Fries','the duck fat fries deserve their own zip code.',
 'food',ARRAY['foodie','trendy','lively','date-night'],'public', now()-interval'55 days'),

-- Alex (5 gems)
('c1000000-0000-0000-0000-000000000011','a3000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000031',
 'Sutro Baths at Low Tide','ruins at low tide. one of the most surreal things near Stanford.',
 'hidden',ARRAY['hidden','scenic','solo','walkable'],'public', now()-interval'5 days'),

('c1000000-0000-0000-0000-000000000012','a3000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000005',
 'Dish Trail Solo Sunrise','solo hike at sunrise for the best start to any Stanford day.',
 'hidden',ARRAY['sunrise','solo','scenic','outdoor'],'public', now()-interval'19 days'),

('c1000000-0000-0000-0000-000000000013','a3000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000020',
 'Rinconada Park Secret','Palo Alto families know this spot but visitors never find it.',
 'hidden',ARRAY['hidden','local','calm','walkable'],'public', now()-interval'37 days'),

('c1000000-0000-0000-0000-000000000014','a3000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000010',
 'EV Garden','the garden tucked behind Escondido Village. open to anyone, known by few.',
 'hidden',ARRAY['hidden','calm','solo','scenic'],'public', now()-interval'52 days'),

('c1000000-0000-0000-0000-000000000015','a3000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000030',
 'GG Park Botanical Garden','free for SF residents. always calm. the cloud forest section is a secret.',
 'hidden',ARRAY['hidden','scenic','solo','calm'],'public', now()-interval'60 days'),

-- Priya (5 gems)
('c1000000-0000-0000-0000-000000000016','a4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000002',
 'Green Library Bender Room','the Bender Room on the 2nd floor. late nights done right. power outlets everywhere.',
 'study',ARRAY['focus','quiet','cozy','solo'],'public', now()-interval'7 days'),

('c1000000-0000-0000-0000-000000000017','a4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000001',
 'CoHo Window Booth','oat milk latte and a booth by the window. perfect for papers and people-watching.',
 'coffee',ARRAY['cozy','focus','local','calm'],'public', now()-interval'16 days'),

('c1000000-0000-0000-0000-000000000018','a4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000007',
 'Main Quad Laptop Session','laptop + AirPods on the grass. nobody judges. best wifi on campus.',
 'study',ARRAY['focus','calm','outdoor','solo'],'public', now()-interval'33 days'),

('c1000000-0000-0000-0000-000000000019','a4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000022',
 'Café Venetia After 2pm','quieter than Coupa after 2pm. strong wifi. no line.',
 'coffee',ARRAY['quiet','focus','cozy','walkable'],'public', now()-interval'41 days'),

('c1000000-0000-0000-0000-000000000044','a4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000009',
 'Tressider Hidden Patio','the back patio at Tressider most people walk right past.',
 'food',ARRAY['hidden','local','calm','outdoor'],'followers', now()-interval'57 days'),

-- Jordan (4 gems)
('c1000000-0000-0000-0000-000000000020','a5000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000004',
 'Frost Amphitheater Summer','outdoor concert season is criminally underrated. lawn section, bring a blanket.',
 'events',ARRAY['social','lively','weekend','outdoor'],'public', now()-interval'11 days'),

('c1000000-0000-0000-0000-000000000021','a5000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000019',
 'Stanford Theatre $3 Films','classic films for $3. the popcorn machine is vintage. go on a Thursday.',
 'entertainment',ARRAY['date-night','cozy','local','artsy'],'public', now()-interval'26 days'),

('c1000000-0000-0000-0000-000000000022','a5000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000013',
 'Evvia for Impressing People','the best dinner spot for convincing someone you have taste.',
 'food',ARRAY['date-night','trendy','social','foodie'],'public', now()-interval'40 days'),

('c1000000-0000-0000-0000-000000000023','a5000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000012',
 'Bird Dog Cocktails','the cocktail list here is slept on. come for the fries, stay for everything.',
 'food',ARRAY['lively','trendy','date-night','social'],'public', now()-interval'53 days'),

-- Maya (5 gems)
('c1000000-0000-0000-0000-000000000024','a6000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000015',
 'PA Farmers Market Sunday Ritual','tamales, flowers, and the occasional VC sighting. every Sunday.',
 'events',ARRAY['local','brunch','social','weekend'],'public', now()-interval'4 days'),

('c1000000-0000-0000-0000-000000000025','a6000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000018',
 'Mayfield Bakery Almond Croissant','the almond croissant situation here cannot be overstated.',
 'food',ARRAY['brunch','cozy','local','foodie'],'public', now()-interval'21 days'),

('c1000000-0000-0000-0000-000000000026','a6000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000032',
 'Fort Mason Farmers Market','SF farmers market with the bridge backdrop. Saturday mornings.',
 'events',ARRAY['local','scenic','social','brunch'],'public', now()-interval'36 days'),

('c1000000-0000-0000-0000-000000000027','a6000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000033',
 'Alamo Square 9am','the Painted Ladies crowd is gone by 9am. early light on the houses.',
 'hidden',ARRAY['scenic','aesthetic','solo','calm'],'public', now()-interval'49 days'),

('c1000000-0000-0000-0000-000000000028','a6000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000025',
 'Bi-Rite Salted Caramel','salted caramel flavor invented here. confirmed. nothing else compares.',
 'food',ARRAY['local','foodie','walkable','affordable'],'public', now()-interval'58 days'),

-- Kai (5 gems)
('c1000000-0000-0000-0000-000000000029','a7000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000021',
 'King Street Coffee','Palo Alto neighborhood spot. zero pretension. regulars know your order.',
 'coffee',ARRAY['local','cozy','walkable','hidden'],'public', now()-interval'8 days'),

('c1000000-0000-0000-0000-000000000030','a7000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000001',
 'CoHo Late Night','underrated as a late-night workspace when the library is full.',
 'coffee',ARRAY['focus','local','cozy','calm'],'public', now()-interval'23 days'),

('c1000000-0000-0000-0000-000000000031','a7000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000026',
 'Dolores Park Sunday','Sunday funday scene. find your corner by 11am or lose it.',
 'events',ARRAY['social','lively','weekend','local'],'public', now()-interval'39 days'),

('c1000000-0000-0000-0000-000000000032','a7000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000013',
 'Evvia Saganaki','the saganaki appetizer alone is worth the trip. order it first.',
 'food',ARRAY['foodie','date-night','trendy','social'],'public', now()-interval'54 days'),

('c1000000-0000-0000-0000-000000000033','a7000000-0000-0000-0000-000000000007','424fd190-4f07-47e3-8623-8ce8e1bfb66f',
 'Coupa Vibes','the closest thing to a Caracas café in the Bay. go for the cortado.',
 'coffee',ARRAY['cozy','local','social','walkable'],'public', now()-interval'62 days'),

-- Sofia (5 gems)
('c1000000-0000-0000-0000-000000000034','a8000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000011',
 'Philz Tesora Iced','the Tesora blend, iced, half sweet. memorize this order.',
 'coffee',ARRAY['cozy','local','calm','walkable'],'public', now()-interval'2 days'),

('c1000000-0000-0000-0000-000000000035','a8000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000006',
 'Cantor Rodin Garden','Rodin sculptures in the outdoor garden. free, always open, deeply undervisited.',
 'entertainment',ARRAY['artsy','calm','solo','aesthetic'],'public', now()-interval'17 days'),

('c1000000-0000-0000-0000-000000000036','a8000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000003',
 'Memorial Church at 4pm','late afternoon light through the mosaics stops time. nobody goes in.',
 'hidden',ARRAY['aesthetic','calm','solo','artsy'],'public', now()-interval'30 days'),

('c1000000-0000-0000-0000-000000000037','a8000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000023',
 'Tartine Country Bread','the country bread at 5pm when it comes out. the crust. the interior.',
 'food',ARRAY['foodie','local','cozy','artsy'],'public', now()-interval'46 days'),

('c1000000-0000-0000-0000-000000000038','a8000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000028',
 'The Mill Thick Toast','thick-cut Japanese milk bread toast. it sounds like a joke until you try it.',
 'coffee',ARRAY['aesthetic','cozy','artsy','calm'],'public', now()-interval'59 days'),

-- Gil bonus
('c1000000-0000-0000-0000-000000000039','f594d26c-9dc8-46ce-9589-9b56aed27adf','b1000000-0000-0000-0000-000000000015',
 'PA Farmers Market Tamale Spot','the tamale vendor in the far corner. cash only. worth it every time.',
 'events',ARRAY['local','affordable','weekend','social'],'public', now()-interval'43 days'),

-- Yu-Jen bonus
('c1000000-0000-0000-0000-000000000043','a2000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000032',
 'Fort Mason Market Finds','best SF market for produce. less crowded than Ferry Building.',
 'events',ARRAY['local','brunch','social','weekend'],'public', now()-interval'50 days'),

-- Priya bonus
('c1000000-0000-0000-0000-000000000045','a4000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000002',
 'Green Library 3am','the 24-hour section. vending machines. a surprising number of people.',
 'study',ARRAY['focus','quiet','solo','cozy'],'followers', now()-interval'63 days')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 5. GEM IMAGES  (external picsum URLs — resolveImageUrl passes them through)
-- =============================================================================
INSERT INTO public.gem_images (gem_id, storage_path, order_index, alt_text) VALUES
('c1000000-0000-0000-0000-000000000001','https://picsum.photos/seed/dish1/600/400',0,'The Dish Trail at sunrise'),
('c1000000-0000-0000-0000-000000000003','https://picsum.photos/seed/tartine1/600/400',0,'Tartine morning bun'),
('c1000000-0000-0000-0000-000000000003','https://picsum.photos/seed/tartine2/600/400',1,'Inside Tartine'),
('c1000000-0000-0000-0000-000000000004','https://picsum.photos/seed/bluebottle1/600/400',0,'Blue Bottle cortado'),
('c1000000-0000-0000-0000-000000000005','https://picsum.photos/seed/dolores1/600/400',0,'Dolores Park secret corner'),
('c1000000-0000-0000-0000-000000000006','https://picsum.photos/seed/landsend1/600/400',0,'Lands End at dusk'),
('c1000000-0000-0000-0000-000000000006','https://picsum.photos/seed/landsend2/600/400',1,'GG Bridge from Lands End'),
('c1000000-0000-0000-0000-000000000007','https://picsum.photos/seed/flourwater1/600/400',0,'Flour+Water pasta'),
('c1000000-0000-0000-0000-000000000011','https://picsum.photos/seed/sutro1/600/400',0,'Sutro Baths ruins'),
('c1000000-0000-0000-0000-000000000011','https://picsum.photos/seed/sutro2/600/400',1,'Sutro Baths at low tide'),
('c1000000-0000-0000-0000-000000000012','https://picsum.photos/seed/dish2/600/400',0,'Dish Trail solo walk'),
('c1000000-0000-0000-0000-000000000015','https://picsum.photos/seed/botanical1/600/400',0,'GG Park botanical garden'),
('c1000000-0000-0000-0000-000000000016','https://picsum.photos/seed/library1/600/400',0,'Bender Room Green Library'),
('c1000000-0000-0000-0000-000000000020','https://picsum.photos/seed/frost1/600/400',0,'Frost Amphitheater concert'),
('c1000000-0000-0000-0000-000000000022','https://picsum.photos/seed/evvia1/600/400',0,'Evvia table'),
('c1000000-0000-0000-0000-000000000024','https://picsum.photos/seed/market1/600/400',0,'Palo Alto Farmers Market'),
('c1000000-0000-0000-0000-000000000027','https://picsum.photos/seed/alamo1/600/400',0,'Alamo Square Painted Ladies'),
('c1000000-0000-0000-0000-000000000027','https://picsum.photos/seed/alamo2/600/400',1,'Alamo Square morning light'),
('c1000000-0000-0000-0000-000000000034','https://picsum.photos/seed/philz1/600/400',0,'Philz Coffee Tesora iced'),
('c1000000-0000-0000-0000-000000000035','https://picsum.photos/seed/cantor1/600/400',0,'Cantor Rodin garden'),
('c1000000-0000-0000-0000-000000000036','https://picsum.photos/seed/memchurch1/600/400',0,'Memorial Church mosaic light'),
('c1000000-0000-0000-0000-000000000038','https://picsum.photos/seed/themill1/600/400',0,'The Mill thick toast'),
('c1000000-0000-0000-0000-000000000040','https://picsum.photos/seed/themill2/600/400',0,'The Mill slow morning'),
('c1000000-0000-0000-0000-000000000029','https://picsum.photos/seed/kingst1/600/400',0,'King Street Coffee interior'),
('c1000000-0000-0000-0000-000000000002','https://picsum.photos/seed/cantor2/600/400',0,'Cantor Arts Center Sunday');


-- =============================================================================
-- 6. FOLLOWS
-- =============================================================================
INSERT INTO public.follows (follower_id, following_id) VALUES
-- Eva follows
('a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002'),
('a1000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000003'),
('a1000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000004'),
('a1000000-0000-0000-0000-000000000001','a5000000-0000-0000-0000-000000000005'),
('a1000000-0000-0000-0000-000000000001','a6000000-0000-0000-0000-000000000006'),
('a1000000-0000-0000-0000-000000000001','a8000000-0000-0000-0000-000000000008'),
('a1000000-0000-0000-0000-000000000001','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
-- Yu-Jen follows
('a2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000003'),
('a2000000-0000-0000-0000-000000000002','a4000000-0000-0000-0000-000000000004'),
('a2000000-0000-0000-0000-000000000002','a6000000-0000-0000-0000-000000000006'),
('a2000000-0000-0000-0000-000000000002','a7000000-0000-0000-0000-000000000007'),
('a2000000-0000-0000-0000-000000000002','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
-- Alex follows
('a3000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001'),
('a3000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000002'),
('a3000000-0000-0000-0000-000000000003','a5000000-0000-0000-0000-000000000005'),
('a3000000-0000-0000-0000-000000000003','a6000000-0000-0000-0000-000000000006'),
('a3000000-0000-0000-0000-000000000003','a7000000-0000-0000-0000-000000000007'),
('a3000000-0000-0000-0000-000000000003','a8000000-0000-0000-0000-000000000008'),
-- Priya follows
('a4000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001'),
('a4000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000002'),
('a4000000-0000-0000-0000-000000000004','a3000000-0000-0000-0000-000000000003'),
('a4000000-0000-0000-0000-000000000004','a5000000-0000-0000-0000-000000000005'),
('a4000000-0000-0000-0000-000000000004','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
-- Jordan follows
('a5000000-0000-0000-0000-000000000005','a3000000-0000-0000-0000-000000000003'),
('a5000000-0000-0000-0000-000000000005','a6000000-0000-0000-0000-000000000006'),
('a5000000-0000-0000-0000-000000000005','a7000000-0000-0000-0000-000000000007'),
('a5000000-0000-0000-0000-000000000005','a8000000-0000-0000-0000-000000000008'),
('a5000000-0000-0000-0000-000000000005','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
-- Maya follows
('a6000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001'),
('a6000000-0000-0000-0000-000000000006','a2000000-0000-0000-0000-000000000002'),
('a6000000-0000-0000-0000-000000000006','a4000000-0000-0000-0000-000000000004'),
('a6000000-0000-0000-0000-000000000006','a5000000-0000-0000-0000-000000000005'),
('a6000000-0000-0000-0000-000000000006','a7000000-0000-0000-0000-000000000007'),
-- Kai follows
('a7000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001'),
('a7000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003'),
('a7000000-0000-0000-0000-000000000007','a4000000-0000-0000-0000-000000000004'),
('a7000000-0000-0000-0000-000000000007','a5000000-0000-0000-0000-000000000005'),
('a7000000-0000-0000-0000-000000000007','a8000000-0000-0000-0000-000000000008'),
('a7000000-0000-0000-0000-000000000007','f594d26c-9dc8-46ce-9589-9b56aed27adf'),
-- Sofia follows
('a8000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000001'),
('a8000000-0000-0000-0000-000000000008','a2000000-0000-0000-0000-000000000002'),
('a8000000-0000-0000-0000-000000000008','a4000000-0000-0000-0000-000000000004'),
('a8000000-0000-0000-0000-000000000008','a6000000-0000-0000-0000-000000000006'),
('a8000000-0000-0000-0000-000000000008','a7000000-0000-0000-0000-000000000007'),
-- Gil follows
('f594d26c-9dc8-46ce-9589-9b56aed27adf','a1000000-0000-0000-0000-000000000001'),
('f594d26c-9dc8-46ce-9589-9b56aed27adf','a2000000-0000-0000-0000-000000000002'),
('f594d26c-9dc8-46ce-9589-9b56aed27adf','a4000000-0000-0000-0000-000000000004'),
('f594d26c-9dc8-46ce-9589-9b56aed27adf','a5000000-0000-0000-0000-000000000005')

ON CONFLICT (follower_id, following_id) DO NOTHING;


-- =============================================================================
-- 7. GEM LIKES  (~43)
-- =============================================================================
INSERT INTO public.gem_likes (gem_id, user_id) VALUES
-- c003 Tartine (Eva's) — liked by many
('c1000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000003','a5000000-0000-0000-0000-000000000005'),
('c1000000-0000-0000-0000-000000000003','a6000000-0000-0000-0000-000000000006'),
-- c011 Sutro Baths (Alex's)
('c1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000011','a4000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000011','a5000000-0000-0000-0000-000000000005'),
('c1000000-0000-0000-0000-000000000011','a6000000-0000-0000-0000-000000000006'),
('c1000000-0000-0000-0000-000000000011','a7000000-0000-0000-0000-000000000007'),
-- c022 Evvia (Jordan's)
('c1000000-0000-0000-0000-000000000022','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000022','a4000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000022','a7000000-0000-0000-0000-000000000007'),
('c1000000-0000-0000-0000-000000000022','a8000000-0000-0000-0000-000000000008'),
-- c027 Alamo Square (Maya's)
('c1000000-0000-0000-0000-000000000027','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000027','a3000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000027','a8000000-0000-0000-0000-000000000008'),
-- c034 Philz (Sofia's)
('c1000000-0000-0000-0000-000000000034','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000034','a2000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000034','a4000000-0000-0000-0000-000000000004'),
-- c036 Memorial Church (Sofia's)
('c1000000-0000-0000-0000-000000000036','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000036','a3000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000036','a7000000-0000-0000-0000-000000000007'),
-- c016 Green Library (Priya's)
('c1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000016','a2000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000016','a7000000-0000-0000-0000-000000000007'),
-- c024 PA Farmers Market (Maya's)
('c1000000-0000-0000-0000-000000000024','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000024','a2000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000024','a4000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000024','a7000000-0000-0000-0000-000000000007'),
-- c001 Dish Trail (Gil's)
('c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000004'),
-- c007 Flour+Water (YuJen's)
('c1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003'),
-- c005 Dolores Park (Eva's)
('c1000000-0000-0000-0000-000000000005','a3000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000005','a7000000-0000-0000-0000-000000000007'),
-- c038 The Mill (Sofia's)
('c1000000-0000-0000-0000-000000000038','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000038','a7000000-0000-0000-0000-000000000007'),
-- c020 Frost Amp (Jordan's)
('c1000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000020','a3000000-0000-0000-0000-000000000003'),
-- c017 CoHo (Priya's)
('c1000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000017','a2000000-0000-0000-0000-000000000002')

ON CONFLICT (gem_id, user_id) DO NOTHING;


-- =============================================================================
-- 8. SAVES  (~44)
-- =============================================================================
INSERT INTO public.saves (user_id, gem_id) VALUES
-- c003 Tartine
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000003'),
('a5000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003'),
('a7000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000003'),
-- c011 Sutro Baths
('a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000011'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000011'),
('a5000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000011'),
('a8000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000011'),
-- c022 Evvia
('a2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000022'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000022'),
('a7000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000022'),
('a8000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000022'),
-- c005 Dolores Park
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000005'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000005'),
('a7000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000005'),
('a8000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000005'),
-- c007 Flour+Water
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000007'),
('a7000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000007'),
('a8000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000007'),
-- c034 Philz
('a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000034'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000034'),
('a5000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000034'),
-- c036 Memorial Church
('a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000036'),
('a2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000036'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000036'),
-- c027 Alamo Square
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000027'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000027'),
('a7000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000027'),
-- c016 Green Library
('a2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000016'),
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000016'),
('a5000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000016'),
-- c001 Dish Trail
('a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000001'),
-- c020 Frost Amp
('a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000020'),
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000020'),
-- c024 PA Farmers Market
('a1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000024'),
('a4000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000024'),
('a5000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000024'),
-- c017 CoHo
('a2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000017'),
('a5000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000017'),
('a7000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000017'),
-- c006 Lands End
('a3000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000006'),
('a8000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000006')

ON CONFLICT (user_id, gem_id) DO NOTHING;


-- =============================================================================
-- 9. COLLECTIONS  (13 collections)
-- =============================================================================
INSERT INTO public.collections (id, owner_id, name, description, visibility) VALUES
('d1000000-0000-0000-0000-000000000001','f594d26c-9dc8-46ce-9589-9b56aed27adf',
 'Weekend Escapes','places I go to decompress. no laptop allowed.','public'),

('d1000000-0000-0000-0000-000000000002','f594d26c-9dc8-46ce-9589-9b56aed27adf',
 'Study Bunkers','for finals season. wifi tested, vibes approved.','private'),

('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001',
 'Bay Area Brunch List','the definitive ranking. updated quarterly.','public'),

('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001',
 'SF Hidden','places that most visitors will never find.','public'),

('d1000000-0000-0000-0000-000000000005','a2000000-0000-0000-0000-000000000002',
 'Food Research','testing for the blog. not ready to share yet.','private'),

('d1000000-0000-0000-0000-000000000006','a3000000-0000-0000-0000-000000000003',
 'Urban Wilderness','nature hiding inside the city and on the edges.','public'),

('d1000000-0000-0000-0000-000000000007','a4000000-0000-0000-0000-000000000004',
 'Work From Anywhere','wifi, vibes, coffee. tested under deadline pressure.','public'),

('d1000000-0000-0000-0000-000000000008','a5000000-0000-0000-0000-000000000005',
 'Date Night Rotation','the spots that always land. updated as needed.','private'),

('d1000000-0000-0000-0000-000000000009','a6000000-0000-0000-0000-000000000006',
 'Sunday Markets','farmers markets ranked by season and tamale quality.','public'),

('d1000000-0000-0000-0000-000000000010','a7000000-0000-0000-0000-000000000007',
 'Neighborhood Coffees','working through every neighborhood. one per block.','public'),

('d1000000-0000-0000-0000-000000000011','a8000000-0000-0000-0000-000000000008',
 'Aesthetic','places that photograph well and feel even better in person.','public'),

('d1000000-0000-0000-0000-000000000012','a4000000-0000-0000-0000-000000000004',
 'Stanford Must-Sees','for incoming frosh. the spots the welcome packet doesn''t mention.','shared'),

('d1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000001',
 'Coffee Pilgrimage','working through all the great Bay Area coffees. in order.','public')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 10. COLLECTION ITEMS  (63 items)
-- =============================================================================
INSERT INTO public.collection_items (id, collection_id, gem_id, place_id, added_by, note) VALUES
-- d001 Gil – Weekend Escapes
('f1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf','go before 7am'),
('f1000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000011',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf','low tide only'),
('f1000000-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000027',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf',NULL),
('f1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000005',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf','the corner spot'),
('f1000000-0000-0000-0000-000000000005','d1000000-0000-0000-0000-000000000001',NULL,'b1000000-0000-0000-0000-000000000026','f594d26c-9dc8-46ce-9589-9b56aed27adf','full park, not just the gem'),

-- d002 Gil – Study Bunkers
('f1000000-0000-0000-0000-000000000006','d1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000016',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf','2nd floor Bender Room'),
('f1000000-0000-0000-0000-000000000007','d1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000017',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf','window seat'),
('f1000000-0000-0000-0000-000000000008','d1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000018',NULL,'f594d26c-9dc8-46ce-9589-9b56aed27adf',NULL),

-- d003 Eva – Bay Area Brunch
('f1000000-0000-0000-0000-000000000009','d1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003',NULL,'a1000000-0000-0000-0000-000000000001','#1 always'),
('f1000000-0000-0000-0000-000000000010','d1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000007',NULL,'a1000000-0000-0000-0000-000000000001',NULL),
('f1000000-0000-0000-0000-000000000011','d1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000022',NULL,'a1000000-0000-0000-0000-000000000001','dinner brunch counts'),
('f1000000-0000-0000-0000-000000000012','d1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000023',NULL,'a1000000-0000-0000-0000-000000000001',NULL),
('f1000000-0000-0000-0000-000000000013','d1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000028',NULL,'a1000000-0000-0000-0000-000000000001','for dessert'),

-- d004 Eva – SF Hidden
('f1000000-0000-0000-0000-000000000014','d1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000005',NULL,'a1000000-0000-0000-0000-000000000001','the corner'),
('f1000000-0000-0000-0000-000000000015','d1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000006',NULL,'a1000000-0000-0000-0000-000000000001','Tuesday evenings'),
('f1000000-0000-0000-0000-000000000016','d1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000015',NULL,'a1000000-0000-0000-0000-000000000001','cloud forest in back'),
('f1000000-0000-0000-0000-000000000017','d1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000027',NULL,'a1000000-0000-0000-0000-000000000001','9am only'),
('f1000000-0000-0000-0000-000000000018','d1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000031',NULL,'a1000000-0000-0000-0000-000000000001',NULL),

-- d005 YuJen – Food Research
('f1000000-0000-0000-0000-000000000019','d1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000007',NULL,'a2000000-0000-0000-0000-000000000002','tasting menu only'),
('f1000000-0000-0000-0000-000000000020','d1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000009',NULL,'a2000000-0000-0000-0000-000000000002',NULL),
('f1000000-0000-0000-0000-000000000021','d1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000010',NULL,'a2000000-0000-0000-0000-000000000002','chocolate malt'),
('f1000000-0000-0000-0000-000000000022','d1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000042',NULL,'a2000000-0000-0000-0000-000000000002','duck fat fries comparison'),

-- d006 Alex – Urban Wilderness
('f1000000-0000-0000-0000-000000000023','d1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000011',NULL,'a3000000-0000-0000-0000-000000000003','low tide essential'),
('f1000000-0000-0000-0000-000000000024','d1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000012',NULL,'a3000000-0000-0000-0000-000000000003','sunrise only'),
('f1000000-0000-0000-0000-000000000025','d1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000013',NULL,'a3000000-0000-0000-0000-000000000003',NULL),
('f1000000-0000-0000-0000-000000000026','d1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000014',NULL,'a3000000-0000-0000-0000-000000000003','hidden garden'),
('f1000000-0000-0000-0000-000000000027','d1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000015',NULL,'a3000000-0000-0000-0000-000000000003','cloud forest section'),

-- d007 Priya – Work From Anywhere
('f1000000-0000-0000-0000-000000000028','d1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000016',NULL,'a4000000-0000-0000-0000-000000000004','best outlets'),
('f1000000-0000-0000-0000-000000000029','d1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000017',NULL,'a4000000-0000-0000-0000-000000000004','morning sessions'),
('f1000000-0000-0000-0000-000000000030','d1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000019',NULL,'a4000000-0000-0000-0000-000000000004','after 2pm'),
('f1000000-0000-0000-0000-000000000031','d1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000038',NULL,'a4000000-0000-0000-0000-000000000004','SF trip workspace'),
('f1000000-0000-0000-0000-000000000032','d1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000030',NULL,'a4000000-0000-0000-0000-000000000004','outdoor option'),

-- d008 Jordan – Date Night
('f1000000-0000-0000-0000-000000000033','d1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000022',NULL,'a5000000-0000-0000-0000-000000000005','never misses'),
('f1000000-0000-0000-0000-000000000034','d1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000023',NULL,'a5000000-0000-0000-0000-000000000005','more casual option'),
('f1000000-0000-0000-0000-000000000035','d1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000035',NULL,'a5000000-0000-0000-0000-000000000005','free, impressive'),

-- d009 Maya – Sunday Markets
('f1000000-0000-0000-0000-000000000036','d1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000024',NULL,'a6000000-0000-0000-0000-000000000006','tamale corner'),
('f1000000-0000-0000-0000-000000000037','d1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000026',NULL,'a6000000-0000-0000-0000-000000000006','bridge views'),
('f1000000-0000-0000-0000-000000000038','d1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000043',NULL,'a6000000-0000-0000-0000-000000000006','best produce'),
('f1000000-0000-0000-0000-000000000039','d1000000-0000-0000-0000-000000000009',NULL,'b1000000-0000-0000-0000-000000000015','a6000000-0000-0000-0000-000000000006','the whole market, not just the gem'),

-- d010 Kai – Neighborhood Coffees
('f1000000-0000-0000-0000-000000000040','d1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000029',NULL,'a7000000-0000-0000-0000-000000000007','regulars spot'),
('f1000000-0000-0000-0000-000000000041','d1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000030',NULL,'a7000000-0000-0000-0000-000000000007','late night'),
('f1000000-0000-0000-0000-000000000042','d1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000034',NULL,'a7000000-0000-0000-0000-000000000007','Tesora iced'),
('f1000000-0000-0000-0000-000000000043','d1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000038',NULL,'a7000000-0000-0000-0000-000000000007','SF trip coffee'),
('f1000000-0000-0000-0000-000000000044','d1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000040',NULL,'a7000000-0000-0000-0000-000000000007','The Mill morning'),

-- d011 Sofia – Aesthetic
('f1000000-0000-0000-0000-000000000045','d1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000005',NULL,'a8000000-0000-0000-0000-000000000008','morning light'),
('f1000000-0000-0000-0000-000000000046','d1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000027',NULL,'a8000000-0000-0000-0000-000000000008','Painted Ladies backdrop'),
('f1000000-0000-0000-0000-000000000047','d1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000035',NULL,'a8000000-0000-0000-0000-000000000008','Rodin garden'),
('f1000000-0000-0000-0000-000000000048','d1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000036',NULL,'a8000000-0000-0000-0000-000000000008','4pm light only'),
('f1000000-0000-0000-0000-000000000049','d1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000037',NULL,'a8000000-0000-0000-0000-000000000008','bread = art'),

-- d012 Priya – Stanford Must-Sees
('f1000000-0000-0000-0000-000000000050','d1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000016',NULL,'a4000000-0000-0000-0000-000000000004','go once before graduation'),
('f1000000-0000-0000-0000-000000000051','d1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000018',NULL,'a4000000-0000-0000-0000-000000000004','the real Stanford'),
('f1000000-0000-0000-0000-000000000052','d1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000035',NULL,'a4000000-0000-0000-0000-000000000004','free + beautiful'),
('f1000000-0000-0000-0000-000000000053','d1000000-0000-0000-0000-000000000012',NULL,'b1000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000004','go inside'),

-- d013 Eva – Coffee Pilgrimage
('f1000000-0000-0000-0000-000000000054','d1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000004',NULL,'a1000000-0000-0000-0000-000000000001','#1 cortado in city'),
('f1000000-0000-0000-0000-000000000055','d1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000017',NULL,'a1000000-0000-0000-0000-000000000001','campus gem'),
('f1000000-0000-0000-0000-000000000056','d1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000019',NULL,'a1000000-0000-0000-0000-000000000001','after 2pm'),
('f1000000-0000-0000-0000-000000000057','d1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000029',NULL,'a1000000-0000-0000-0000-000000000001','neighborhood classic'),
('f1000000-0000-0000-0000-000000000058','d1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000034',NULL,'a1000000-0000-0000-0000-000000000001','Tesora iced half sweet')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 11. COMMENTS  (70 total; replies inserted after their parents)
-- Only top-level (parent_comment_id IS NULL) increment comment_count via trigger.
-- =============================================================================
INSERT INTO public.comments (id, gem_id, author_id, parent_comment_id, body, created_at) VALUES

-- c003 Tartine (Eva)
('e1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000002',NULL,
 'the morning bun is life-changing. go at 8am to beat the line', now()-interval'2 days 14 hours'),
('e1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000004',NULL,
 'waited 40 min last weekend and zero regrets', now()-interval'2 days 10 hours'),
('e1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000003','e1000000-0000-0000-0000-000000000001',
 '8am tip is gold, confirmed', now()-interval'2 days 8 hours'),
('e1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000003','a5000000-0000-0000-0000-000000000005',NULL,
 'this is the one place I will wait in line for', now()-interval'1 day 20 hours'),
('e1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003','a6000000-0000-0000-0000-000000000006',NULL,
 'the lemon cream tart too. not just the bun', now()-interval'1 day 6 hours'),

-- c011 Sutro Baths (Alex)
('e1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000001',NULL,
 'went last week because of this post. cannot stop thinking about it', now()-interval'4 days 12 hours'),
('e1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000011','a4000000-0000-0000-0000-000000000004',NULL,
 'it feels like another planet', now()-interval'4 days 8 hours'),
('e1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000011','a5000000-0000-0000-0000-000000000005','e1000000-0000-0000-0000-000000000006',
 'same, took my whole family', now()-interval'4 days 2 hours'),
('e1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000011','a6000000-0000-0000-0000-000000000006',NULL,
 'the light at sunset here is unreal', now()-interval'3 days 18 hours'),
('e1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000011','a8000000-0000-0000-0000-000000000008',NULL,
 'ruins at high tide look completely different. two separate experiences', now()-interval'3 days 4 hours'),

-- c022 Evvia (Jordan)
('e1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000022','a1000000-0000-0000-0000-000000000001',NULL,
 'the lamb chops are the move. not optional', now()-interval'10 days 5 hours'),
('e1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000022','a8000000-0000-0000-0000-000000000008',NULL,
 'agreed, and the sea bass for something lighter', now()-interval'9 days 22 hours'),
('e1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000022','a4000000-0000-0000-0000-000000000004','e1000000-0000-0000-0000-000000000011',
 'seconded, ordered those immediately', now()-interval'9 days 14 hours'),
('e1000000-0000-0000-0000-000000000014','c1000000-0000-0000-0000-000000000022','a7000000-0000-0000-0000-000000000007',NULL,
 'jordan''s rec list never misses', now()-interval'8 days 20 hours'),

-- c016 Green Library (Priya)
('e1000000-0000-0000-0000-000000000015','c1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000001',NULL,
 'the Bender Room is where I wrote my thesis', now()-interval'6 days 16 hours'),
('e1000000-0000-0000-0000-000000000016','c1000000-0000-0000-0000-000000000016','a2000000-0000-0000-0000-000000000002',NULL,
 'didn''t know about this room, going tomorrow', now()-interval'6 days 10 hours'),
('e1000000-0000-0000-0000-000000000017','c1000000-0000-0000-0000-000000000016','a3000000-0000-0000-0000-000000000003','e1000000-0000-0000-0000-000000000016',
 'bring your charger, outlets are limited', now()-interval'6 days 6 hours'),

-- c005 Dolores Park (Eva)
('e1000000-0000-0000-0000-000000000018','c1000000-0000-0000-0000-000000000005','a3000000-0000-0000-0000-000000000003',NULL,
 'which corner exactly? by the 20th st entrance?', now()-interval'8 days 14 hours'),
('e1000000-0000-0000-0000-000000000019','c1000000-0000-0000-0000-000000000005','a4000000-0000-0000-0000-000000000004','e1000000-0000-0000-0000-000000000018',
 'yes, cut through the trees on the right side', now()-interval'8 days 10 hours'),
('e1000000-0000-0000-0000-000000000020','c1000000-0000-0000-0000-000000000005','a6000000-0000-0000-0000-000000000006',NULL,
 'this is the spot I have been looking for', now()-interval'7 days 20 hours'),
('e1000000-0000-0000-0000-000000000021','c1000000-0000-0000-0000-000000000005','a7000000-0000-0000-0000-000000000007',NULL,
 'Sunday morning energy here is different', now()-interval'7 days 8 hours'),

-- c034 Philz (Sofia)
('e1000000-0000-0000-0000-000000000022','c1000000-0000-0000-0000-000000000034','a1000000-0000-0000-0000-000000000001',NULL,
 'Tesora iced half sweet should be its own menu item', now()-interval'1 day 18 hours'),
('e1000000-0000-0000-0000-000000000023','c1000000-0000-0000-0000-000000000034','a2000000-0000-0000-0000-000000000002',NULL,
 'switching from Coupa because of this post', now()-interval'1 day 12 hours'),
('e1000000-0000-0000-0000-000000000024','c1000000-0000-0000-0000-000000000034','a4000000-0000-0000-0000-000000000004','e1000000-0000-0000-0000-000000000023',
 'don''t abandon Coupa, they serve different needs', now()-interval'1 day 8 hours'),

-- c007 Flour+Water (YuJen)
('e1000000-0000-0000-0000-000000000025','c1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001',NULL,
 'the pasta changes every season, my favorite SF ritual', now()-interval'5 days 20 hours'),
('e1000000-0000-0000-0000-000000000026','c1000000-0000-0000-0000-000000000007','a3000000-0000-0000-0000-000000000003',NULL,
 'is it actually worth the wait?', now()-interval'5 days 14 hours'),
('e1000000-0000-0000-0000-000000000027','c1000000-0000-0000-0000-000000000007','a2000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000026',
 'make a reservation, the wait is manageable with one', now()-interval'5 days 8 hours'),

-- c027 Alamo Square (Maya)
('e1000000-0000-0000-0000-000000000028','c1000000-0000-0000-0000-000000000027','a1000000-0000-0000-0000-000000000001',NULL,
 '9am golden hour energy here is real', now()-interval'12 days 16 hours'),
('e1000000-0000-0000-0000-000000000029','c1000000-0000-0000-0000-000000000027','a3000000-0000-0000-0000-000000000003',NULL,
 'crowd is gone by 8:30 on weekdays', now()-interval'12 days 10 hours'),
('e1000000-0000-0000-0000-000000000030','c1000000-0000-0000-0000-000000000027','a8000000-0000-0000-0000-000000000008',NULL,
 'took my best photos here last month', now()-interval'11 days 20 hours'),

-- c024 PA Farmers Market (Maya)
('e1000000-0000-0000-0000-000000000031','c1000000-0000-0000-0000-000000000024','a2000000-0000-0000-0000-000000000002',NULL,
 'the tamale vendor in the far corner. every Sunday without fail', now()-interval'3 days 14 hours'),
('e1000000-0000-0000-0000-000000000032','c1000000-0000-0000-0000-000000000024','a4000000-0000-0000-0000-000000000004',NULL,
 'the flower stalls for your apartment. instant upgrade', now()-interval'3 days 8 hours'),
('e1000000-0000-0000-0000-000000000033','c1000000-0000-0000-0000-000000000024','a1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000031',
 'which vendor? there are two tamale spots now', now()-interval'3 days 2 hours'),

-- c001 Dish Trail (Gil)
('e1000000-0000-0000-0000-000000000034','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',NULL,
 'this was the first thing I did when I got to Stanford', now()-interval'11 days 12 hours'),
('e1000000-0000-0000-0000-000000000035','c1000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000004',NULL,
 '5:30am before class actually works', now()-interval'10 days 18 hours'),
('e1000000-0000-0000-0000-000000000036','c1000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000003',NULL,
 'the sunrise view from the top right after dawn is worth every step', now()-interval'10 days 6 hours'),

-- c017 CoHo (Priya)
('e1000000-0000-0000-0000-000000000037','c1000000-0000-0000-0000-000000000017','a2000000-0000-0000-0000-000000000002',NULL,
 'booth by the window confirmed. it''s the move', now()-interval'15 days 14 hours'),
('e1000000-0000-0000-0000-000000000038','c1000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000001',NULL,
 'oat milk here tastes better than everywhere else. no idea why', now()-interval'15 days 8 hours'),

-- c025 Mayfield (Maya)
('e1000000-0000-0000-0000-000000000039','c1000000-0000-0000-0000-000000000025','a4000000-0000-0000-0000-000000000004',NULL,
 'almond croissant sold out by 9am on weekends. set an alarm', now()-interval'20 days 12 hours'),
('e1000000-0000-0000-0000-000000000040','c1000000-0000-0000-0000-000000000025','a1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000039',
 'worth it, confirmed the alarm method last Saturday', now()-interval'20 days 6 hours'),
('e1000000-0000-0000-0000-000000000041','c1000000-0000-0000-0000-000000000025','a7000000-0000-0000-0000-000000000007',NULL,
 'this became my weekend anchor spot', now()-interval'19 days 20 hours'),

-- c036 Memorial Church (Sofia)
('e1000000-0000-0000-0000-000000000042','c1000000-0000-0000-0000-000000000036','a1000000-0000-0000-0000-000000000001',NULL,
 'the mosaic light at 4pm is a once-in-a-semester experience', now()-interval'29 days 14 hours'),
('e1000000-0000-0000-0000-000000000043','c1000000-0000-0000-0000-000000000036','a2000000-0000-0000-0000-000000000002',NULL,
 'never been inside despite 2 years on campus', now()-interval'29 days 8 hours'),
('e1000000-0000-0000-0000-000000000044','c1000000-0000-0000-0000-000000000036','a4000000-0000-0000-0000-000000000004','e1000000-0000-0000-0000-000000000043',
 'go NOW before you graduate, I mean it', now()-interval'29 days 2 hours'),
('e1000000-0000-0000-0000-000000000045','c1000000-0000-0000-0000-000000000036','a3000000-0000-0000-0000-000000000003',NULL,
 'concerts here are secret-worthy too', now()-interval'28 days 16 hours'),

-- c012 Dish Trail (Alex)
('e1000000-0000-0000-0000-000000000046','c1000000-0000-0000-0000-000000000012','a4000000-0000-0000-0000-000000000004',NULL,
 'solo hiking here changed the mood of my whole semester', now()-interval'18 days 14 hours'),
('e1000000-0000-0000-0000-000000000047','c1000000-0000-0000-0000-000000000012','a7000000-0000-0000-0000-000000000007',NULL,
 'the reservoir view when it''s clear is otherworldly', now()-interval'18 days 8 hours'),

-- c020 Frost Amp (Jordan)
('e1000000-0000-0000-0000-000000000048','c1000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000001',NULL,
 'outdoor concerts in summer are what the Bay Area was made for', now()-interval'10 days 16 hours'),
('e1000000-0000-0000-0000-000000000049','c1000000-0000-0000-0000-000000000020','a3000000-0000-0000-0000-000000000003',NULL,
 'the lawn section is key, bring a blanket', now()-interval'10 days 10 hours'),
('e1000000-0000-0000-0000-000000000050','c1000000-0000-0000-0000-000000000020','a6000000-0000-0000-0000-000000000006','e1000000-0000-0000-0000-000000000049',
 'and snacks, they let you bring food in', now()-interval'10 days 4 hours'),

-- c015 GG Botanical (Alex)
('e1000000-0000-0000-0000-000000000051','c1000000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000001',NULL,
 'free for SF residents and somehow still always empty', now()-interval'22 days 14 hours'),
('e1000000-0000-0000-0000-000000000052','c1000000-0000-0000-0000-000000000015','a8000000-0000-0000-0000-000000000008',NULL,
 'the cloud forest section feels like a different country', now()-interval'22 days 8 hours'),
('e1000000-0000-0000-0000-000000000053','c1000000-0000-0000-0000-000000000015','a4000000-0000-0000-0000-000000000004','e1000000-0000-0000-0000-000000000052',
 'which section is that exactly?', now()-interval'22 days 2 hours'),
('e1000000-0000-0000-0000-000000000054','c1000000-0000-0000-0000-000000000015','a8000000-0000-0000-0000-000000000008','e1000000-0000-0000-0000-000000000053',
 'far back past the main lawn, follow the mist', now()-interval'21 days 20 hours'),

-- c038 The Mill (Sofia)
('e1000000-0000-0000-0000-000000000055','c1000000-0000-0000-0000-000000000038','a1000000-0000-0000-0000-000000000001',NULL,
 'the toast here sounds like a joke until you try it', now()-interval'16 days 14 hours'),
('e1000000-0000-0000-0000-000000000056','c1000000-0000-0000-0000-000000000038','a7000000-0000-0000-0000-000000000007',NULL,
 'thick-cut Japanese milk bread. it makes sense when you see it', now()-interval'16 days 8 hours'),
('e1000000-0000-0000-0000-000000000057','c1000000-0000-0000-0000-000000000038','a2000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000055',
 'ordered it skeptically. converted immediately', now()-interval'16 days 2 hours'),

-- c004 Blue Bottle (Eva)
('e1000000-0000-0000-0000-000000000058','c1000000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004',NULL,
 'the cortado here is different from every other Blue Bottle location', now()-interval'17 days 14 hours'),
('e1000000-0000-0000-0000-000000000059','c1000000-0000-0000-0000-000000000004','a8000000-0000-0000-0000-000000000008',NULL,
 'I think it''s the water actually', now()-interval'17 days 8 hours'),

-- c028 Bi-Rite (Maya)
('e1000000-0000-0000-0000-000000000060','c1000000-0000-0000-0000-000000000028','a2000000-0000-0000-0000-000000000002',NULL,
 'the salted caramel is the thing. ignore the other flavors until you''ve had it', now()-interval'25 days 14 hours'),
('e1000000-0000-0000-0000-000000000061','c1000000-0000-0000-0000-000000000028','a1000000-0000-0000-0000-000000000001',NULL,
 'the honey lavender in summer though. don''t sleep on it', now()-interval'25 days 8 hours'),

-- c023 Bird Dog (Jordan)
('e1000000-0000-0000-0000-000000000062','c1000000-0000-0000-0000-000000000023','a1000000-0000-0000-0000-000000000001',NULL,
 'duck fat fries confirmed life-changing', now()-interval'14 days 12 hours'),
('e1000000-0000-0000-0000-000000000063','c1000000-0000-0000-0000-000000000023','a8000000-0000-0000-0000-000000000008',NULL,
 'the cocktail list too. don''t sleep on it', now()-interval'14 days 6 hours'),

-- c029 King Street Coffee (Kai)
('e1000000-0000-0000-0000-000000000064','c1000000-0000-0000-0000-000000000029','a4000000-0000-0000-0000-000000000004',NULL,
 'this is the neighborhood gem I needed', now()-interval'7 days 14 hours'),
('e1000000-0000-0000-0000-000000000065','c1000000-0000-0000-0000-000000000029','a1000000-0000-0000-0000-000000000001',NULL,
 'feels like a secret handshake to know this place exists', now()-interval'7 days 8 hours'),

-- c013 Rinconada (Alex)
('e1000000-0000-0000-0000-000000000066','c1000000-0000-0000-0000-000000000013','a6000000-0000-0000-0000-000000000006',NULL,
 'Palo Alto parents with strollers doing hot girl walks at 7am', now()-interval'35 days 12 hours'),
('e1000000-0000-0000-0000-000000000067','c1000000-0000-0000-0000-000000000013','a5000000-0000-0000-0000-000000000005','e1000000-0000-0000-0000-000000000066',
 'lol accurate, saw this exact thing', now()-interval'35 days 6 hours'),

-- c009 Oren's (YuJen)
('e1000000-0000-0000-0000-000000000068','c1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000001',NULL,
 'I have been here 6 times this semester and counting', now()-interval'30 days 14 hours'),
('e1000000-0000-0000-0000-000000000069','c1000000-0000-0000-0000-000000000009','a3000000-0000-0000-0000-000000000003',NULL,
 'the pita alone is reason enough to go', now()-interval'30 days 8 hours'),

-- c006 Lands End (Eva)
('e1000000-0000-0000-0000-000000000070','c1000000-0000-0000-0000-000000000006','a3000000-0000-0000-0000-000000000003',NULL,
 'weekday afternoon on the cliffs. nobody there. just wind and the bridge', now()-interval'21 days 14 hours')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 12. VERIFICATION  (run to confirm counts look right)
-- =============================================================================
SELECT 'profiles'         AS tbl, count(*) FROM public.profiles
UNION ALL
SELECT 'places',          count(*) FROM public.places
UNION ALL
SELECT 'gems',            count(*) FROM public.gems
UNION ALL
SELECT 'gem_images',      count(*) FROM public.gem_images
UNION ALL
SELECT 'follows',         count(*) FROM public.follows
UNION ALL
SELECT 'gem_likes',       count(*) FROM public.gem_likes
UNION ALL
SELECT 'saves',           count(*) FROM public.saves
UNION ALL
SELECT 'collections',     count(*) FROM public.collections
UNION ALL
SELECT 'collection_items',count(*) FROM public.collection_items
UNION ALL
SELECT 'comments',        count(*) FROM public.comments
ORDER BY 1;
