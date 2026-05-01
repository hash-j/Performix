-- DEMO DATA SEEDING SCRIPT FOR PERFORMIX
-- You can run this directly in your Neon console or via psql

-- 1. Create a Demo Company
INSERT INTO companies (id, name, industry, subscription_plan) VALUES 
('00000000-0000-0000-0000-000000000000', 'Demo Agency', 'Marketing', 'pro')
ON CONFLICT DO NOTHING;

-- 2. Create a Demo Admin User for the Company
-- The password is 'password123' (hashed via bcrypt in the original seed-users.js, but for raw SQL we use a known hash)
-- Hash for 'password123' is $2a$10$X8m1D42a9.Z.a21J5bO2Z.g5q3Uv2K0Y2d72f9m9U3H4k3D0W8gO2
INSERT INTO users (id, company_id, full_name, username, email, password_hash, role) VALUES 
('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'Demo Admin', 'admin', 'admin@demoagency.com', '$2a$10$X8m1D42a9.Z.a21J5bO2Z.g5q3Uv2K0Y2d72f9m9U3H4k3D0W8gO2', 'admin')
ON CONFLICT DO NOTHING;

-- 3. Insert Demo Clients (Linked to Company)
INSERT INTO clients (id, company_id, name) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Acme Corp'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'Globex Industries'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'Stark Enterprises')
ON CONFLICT DO NOTHING;

-- 4. Insert Demo Team Members (Linked to Company)
INSERT INTO team_members (id, company_id, name, email) VALUES
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'Alice Smith', 'alice@demoagency.com'),
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'Bob Johnson', 'bob@demoagency.com'),
('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'Sarah Connor', 'sarah@demoagency.com')
ON CONFLICT (email) DO NOTHING;

-- 5. Insert Social Media KPIs (Linked to Company)
INSERT INTO social_media_kpis (company_id, client_id, team_member_id, date, platform, quality_score, quantity, instagram_posts, instagram_posts_quality) VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, 'Instagram', 9, 20, 5, 8),
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 'TikTok', 8, 15, 0, 0);

-- 6. Insert Website SEO KPIs (Linked to Company)
INSERT INTO website_seo_kpis (company_id, client_id, team_member_id, date, blogs_posted, backlinks, domain_authority, site_health) VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', CURRENT_DATE, 4, 150, 45, 92),
('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', CURRENT_DATE - 2, 2, 85, 38, 85);

-- 7. Insert Ads KPIs (Linked to Company)
INSERT INTO ads_kpis (company_id, client_id, team_member_id, date, platform, cost_per_lead, lead_quality, closing_ratio, quantity_leads) VALUES
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 'Facebook ADS', 12.50, 8, 3.5, 45),
('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, 'Google ADS', 25.00, 9, 5.0, 20);

-- 8. Insert Email Marketing KPIs (Linked to Company)
INSERT INTO email_marketing_kpis (company_id, client_id, team_member_id, date, template_quality, emails_sent, opening_ratio) VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', CURRENT_DATE, 9, 2500, 42.5),
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE - 3, 7, 5000, 18.2);

-- 9. Insert Team KPIs (Linked to Company)
INSERT INTO team_kpis (company_id, team_member_id, date, tasks_assigned, tasks_completed, quality_score, responsibility_score, punctuality_score) VALUES
('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', CURRENT_DATE, 10, 10, 9, 10, 9),
('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 15, 12, 8, 8, 10);

-- 10. Insert Client Responses (Linked to Company)
INSERT INTO client_responses (company_id, client_id, team_member_id, date, review_rating, review_comment) VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', CURRENT_DATE, 5, 'Excellent service and great communication!'),
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', CURRENT_DATE - 1, 4, 'Good results, expecting more leads next month.');
