-- DEMO DATA SEEDING SCRIPT FOR PERFORMIX
-- You can run this directly in your Neon console or via psql

-- 1. Insert Demo Clients
INSERT INTO clients (id, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'Acme Corp'),
('22222222-2222-2222-2222-222222222222', 'Globex Industries'),
('33333333-3333-3333-3333-333333333333', 'Stark Enterprises')
ON CONFLICT DO NOTHING;

-- 2. Insert Demo Team Members
INSERT INTO team_members (id, name, email) VALUES
('44444444-4444-4444-4444-444444444444', 'Alice Smith', 'alice@performix.local'),
('55555555-5555-5555-5555-555555555555', 'Bob Johnson', 'bob@performix.local'),
('66666666-6666-6666-6666-666666666666', 'Sarah Connor', 'sarah@performix.local')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Social Media KPIs
INSERT INTO social_media_kpis (client_id, team_member_id, date, platform, quality_score, quantity, instagram_posts, instagram_posts_quality) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, 'Instagram', 9, 20, 5, 8),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 'TikTok', 8, 15, 0, 0);

-- 4. Insert Website SEO KPIs
INSERT INTO website_seo_kpis (client_id, team_member_id, date, blogs_posted, backlinks, domain_authority, site_health) VALUES
('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', CURRENT_DATE, 4, 150, 45, 92),
('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', CURRENT_DATE - 2, 2, 85, 38, 85);

-- 5. Insert Ads KPIs
INSERT INTO ads_kpis (client_id, team_member_id, date, platform, cost_per_lead, lead_quality, closing_ratio, quantity_leads) VALUES
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 'Facebook ADS', 12.50, 8, 3.5, 45),
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, 'Google ADS', 25.00, 9, 5.0, 20);

-- 6. Insert Email Marketing KPIs
INSERT INTO email_marketing_kpis (client_id, team_member_id, date, template_quality, emails_sent, opening_ratio) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', CURRENT_DATE, 9, 2500, 42.5),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE - 3, 7, 5000, 18.2);

-- 7. Insert Team KPIs
INSERT INTO team_kpis (team_member_id, date, tasks_assigned, tasks_completed, quality_score, responsibility_score, punctuality_score) VALUES
('44444444-4444-4444-4444-444444444444', CURRENT_DATE, 10, 10, 9, 10, 9),
('55555555-5555-5555-5555-555555555555', CURRENT_DATE, 15, 12, 8, 8, 10);

-- 8. Insert Client Responses
INSERT INTO client_responses (client_id, team_member_id, date, review_rating, review_comment) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', CURRENT_DATE, 5, 'Excellent service and great communication!'),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE - 1, 4, 'Good results, expecting more leads next month.');
