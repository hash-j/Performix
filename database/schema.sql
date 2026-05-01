-- Clean up old hardcoded single-company schema
DROP TABLE IF EXISTS social_media_kpis CASCADE;
DROP TABLE IF EXISTS website_seo_kpis CASCADE;
DROP TABLE IF EXISTS ads_kpis CASCADE;
DROP TABLE IF EXISTS email_marketing_kpis CASCADE;
DROP TABLE IF EXISTS client_responses CASCADE;
DROP TABLE IF EXISTS team_kpis CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Create Companies (Tenants) Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table (Dashboard Logins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('superadmin', 'admin', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- 3. Create Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clients_company ON clients(company_id);

-- 4. Create Team Members Table (People whose KPIs are tracked)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_team_members_company ON team_members(company_id);

-- 5. Social Media KPIs
CREATE TABLE social_media_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    team_member_ids UUID[] DEFAULT '{}',
    date DATE NOT NULL,
    platform VARCHAR(100) NOT NULL,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
    quantity INTEGER DEFAULT 0,
    instagram_stories INTEGER DEFAULT 0,
    instagram_stories_quality INTEGER DEFAULT 5,
    instagram_posts INTEGER DEFAULT 0,
    instagram_posts_quality INTEGER DEFAULT 5,
    instagram_reels INTEGER DEFAULT 0,
    instagram_reels_quality INTEGER DEFAULT 5,
    facebook_stories INTEGER DEFAULT 0,
    facebook_stories_quality INTEGER DEFAULT 5,
    facebook_posts INTEGER DEFAULT 0,
    facebook_posts_quality INTEGER DEFAULT 5,
    facebook_reels INTEGER DEFAULT 0,
    facebook_reels_quality INTEGER DEFAULT 5,
    tiktok_stories INTEGER DEFAULT 0,
    tiktok_stories_quality INTEGER DEFAULT 5,
    tiktok_posts INTEGER DEFAULT 0,
    tiktok_posts_quality INTEGER DEFAULT 5,
    tiktok_reels INTEGER DEFAULT 0,
    tiktok_reels_quality INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sm_company ON social_media_kpis(company_id);

-- 6. Website SEO KPIs
CREATE TABLE website_seo_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    team_member_ids UUID[] DEFAULT '{}',
    date DATE NOT NULL,
    blogs_posted INTEGER DEFAULT 0,
    backlinks INTEGER DEFAULT 0,
    domain_authority INTEGER DEFAULT 0,
    site_health INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_seo_company ON website_seo_kpis(company_id);

-- 7. Ads KPIs
CREATE TABLE ads_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    team_member_ids UUID[] DEFAULT '{}',
    date DATE NOT NULL,
    platform VARCHAR(100) NOT NULL,
    cost_per_lead DECIMAL(10,2) DEFAULT 0,
    lead_quality INTEGER CHECK (lead_quality BETWEEN 1 AND 10),
    closing_ratio DECIMAL(5,2) DEFAULT 0,
    quantity_leads INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ads_company ON ads_kpis(company_id);

-- 8. Email Marketing KPIs
CREATE TABLE email_marketing_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    team_member_ids UUID[] DEFAULT '{}',
    date DATE NOT NULL,
    template_quality INTEGER CHECK (template_quality BETWEEN 1 AND 10),
    emails_sent INTEGER DEFAULT 0,
    opening_ratio DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_email_company ON email_marketing_kpis(company_id);

-- 9. Team KPIs
CREATE TABLE team_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
    responsibility_score INTEGER CHECK (responsibility_score BETWEEN 1 AND 10),
    punctuality_score INTEGER CHECK (punctuality_score BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_team_kpis_company ON team_kpis(company_id);

-- 10. Client Responses
CREATE TABLE client_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    team_member_ids UUID[] DEFAULT '{}',
    date DATE NOT NULL,
    review_rating INTEGER CHECK (review_rating BETWEEN 1 AND 5),
    review_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_responses_company ON client_responses(company_id);

-- 11. Activity Log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(255),
    tab_name VARCHAR(100),
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_activity_log_company ON activity_log(company_id);

-- 12. Integrations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'connected',
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, platform)
);
CREATE INDEX idx_integrations_company ON integrations(company_id);

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_sm_kpis_updated_at BEFORE UPDATE ON social_media_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_seo_kpis_updated_at BEFORE UPDATE ON website_seo_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ads_kpis_updated_at BEFORE UPDATE ON ads_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_email_kpis_updated_at BEFORE UPDATE ON email_marketing_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_team_kpis_updated_at BEFORE UPDATE ON team_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_responses_updated_at BEFORE UPDATE ON client_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
