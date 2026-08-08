BEGIN;

CREATE TABLE IF NOT EXISTS incidents (
  id serial PRIMARY KEY,
  title varchar(160) NOT NULL,
  hashtag varchar(120) NOT NULL,
  category varchar(32) NOT NULL CHECK (
    category IN ('banjir', 'jalan_rusak', 'sampah', 'lampu_jalan', 'kemacetan', 'lingkungan')
  ),
  area varchar(80) NOT NULL,
  lat double precision NOT NULL CHECK (lat BETWEEN -7.5 AND -7.0),
  lng double precision NOT NULL CHECK (lng BETWEEN 112.5 AND 113.0),
  report_count integer NOT NULL DEFAULT 1 CHECK (report_count >= 0),
  affected_users integer NOT NULL DEFAULT 0 CHECK (affected_users >= 0),
  avg_severity integer NOT NULL DEFAULT 0 CHECK (avg_severity BETWEEN 0 AND 100),
  engagement integer NOT NULL DEFAULT 0 CHECK (engagement >= 0),
  avg_verification integer NOT NULL DEFAULT 0 CHECK (avg_verification BETWEEN 0 AND 100),
  impact_score integer NOT NULL DEFAULT 0 CHECK (impact_score BETWEEN 0 AND 100),
  status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  ai_summary text,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS incidents_category_area_unique
  ON incidents (category, area);
CREATE INDEX IF NOT EXISTS incidents_impact_idx
  ON incidents (impact_score DESC);
CREATE INDEX IF NOT EXISTS incidents_status_idx
  ON incidents (status);

CREATE TABLE IF NOT EXISTS reports (
  id serial PRIMARY KEY,
  reporter_name varchar(80) NOT NULL,
  reporter_email varchar(160) NOT NULL,
  reporter_whatsapp varchar(24),
  lat double precision CHECK (lat BETWEEN -7.5 AND -7.0),
  lng double precision CHECK (lng BETWEEN 112.5 AND 113.0),
  area varchar(80) NOT NULL,
  category varchar(32) NOT NULL CHECK (
    category IN ('banjir', 'jalan_rusak', 'sampah', 'lampu_jalan', 'kemacetan', 'lingkungan')
  ),
  description varchar(1500) NOT NULL,
  media_url text,
  hashtags text[] NOT NULL DEFAULT '{}',
  severity_score integer NOT NULL DEFAULT 0 CHECK (severity_score BETWEEN 0 AND 100),
  verification_score integer NOT NULL DEFAULT 0 CHECK (verification_score BETWEEN 0 AND 100),
  ai_summary text,
  ai_status varchar(32) NOT NULL DEFAULT 'analyzed',
  incident_id integer REFERENCES incidents(id) ON DELETE SET NULL,
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  shares integer NOT NULL DEFAULT 0 CHECK (shares >= 0),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_public_created_idx
  ON reports (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_category_idx
  ON reports (category);
CREATE INDEX IF NOT EXISTS reports_incident_idx
  ON reports (incident_id);

CREATE TABLE IF NOT EXISTS comments (
  id serial PRIMARY KEY,
  report_id integer NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  author varchar(80) NOT NULL DEFAULT 'Citizen',
  content varchar(500) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_report_created_idx
  ON comments (report_id, created_at);

COMMIT;
