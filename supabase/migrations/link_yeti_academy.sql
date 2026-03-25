-- Link Yeti Academy business to test123@gmail.com user
UPDATE public.businesses
SET user_id = (SELECT id FROM public.users WHERE email = 'test123@gmail.com')
WHERE name = 'Yeti Academy';
