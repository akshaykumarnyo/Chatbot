-- ============================================================
-- Sales AI Chatbot — PostgreSQL Schema
-- Tables: users, sessions, messages, sales_data, query_cache
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast text search

-- ── 1. USERS (master) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    full_name     VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'user',   -- user | admin
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(role);
CREATE INDEX idx_users_active  ON users(is_active);

-- ── 2. SESSIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(255),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ,
    metadata      JSONB       DEFAULT '{}'
);

CREATE INDEX idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX idx_sessions_active     ON sessions(is_active);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- ── 3. MESSAGES (chat history) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
    content         TEXT        NOT NULL,
    sql_generated   TEXT,               -- SQL that was generated for this message
    rows_returned   INTEGER     DEFAULT 0,
    execution_ms    INTEGER,            -- DB query execution time
    llm_model       VARCHAR(100),       -- which model answered
    token_count     INTEGER,
    is_error        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata        JSONB       DEFAULT '{}'
);

CREATE INDEX idx_messages_session_id  ON messages(session_id);
CREATE INDEX idx_messages_user_id     ON messages(user_id);
CREATE INDEX idx_messages_created_at  ON messages(created_at DESC);
CREATE INDEX idx_messages_role        ON messages(role);
-- Full-text search on message content
CREATE INDEX idx_messages_content_fts ON messages USING gin(to_tsvector('english', content));

-- ── 4. SALES DATA ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_data (
    id                  BIGSERIAL   PRIMARY KEY,
    order_id            VARCHAR(50) UNIQUE NOT NULL,
    order_date          DATE        NOT NULL,
    ship_date           DATE,
    ship_mode           VARCHAR(50),
    customer_id         VARCHAR(50),
    customer_name       VARCHAR(255),
    segment             VARCHAR(50),       -- Consumer, Corporate, Home Office
    country             VARCHAR(100),
    city                VARCHAR(100),
    state               VARCHAR(100),
    postal_code         VARCHAR(20),
    region              VARCHAR(50),
    product_id          VARCHAR(50),
    category            VARCHAR(100),
    sub_category        VARCHAR(100),
    product_name        VARCHAR(500),
    sales               NUMERIC(12,4),
    quantity            INTEGER,
    discount            NUMERIC(5,4),
    profit              NUMERIC(12,4),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_order_date    ON sales_data(order_date);
CREATE INDEX idx_sales_category      ON sales_data(category);
CREATE INDEX idx_sales_sub_category  ON sales_data(sub_category);
CREATE INDEX idx_sales_region        ON sales_data(region);
CREATE INDEX idx_sales_segment       ON sales_data(segment);
CREATE INDEX idx_sales_customer_id   ON sales_data(customer_id);
CREATE INDEX idx_sales_product_id    ON sales_data(product_id);
CREATE INDEX idx_sales_profit        ON sales_data(profit);
-- Composite for common analytics queries
CREATE INDEX idx_sales_date_category ON sales_data(order_date, category);
CREATE INDEX idx_sales_region_seg    ON sales_data(region, segment);

-- ── 5. QUERY CACHE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS query_cache (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_hash   VARCHAR(64) NOT NULL UNIQUE,   -- SHA256 of normalised question
    question_text   TEXT        NOT NULL,
    sql_query       TEXT        NOT NULL,
    result_json     JSONB,
    hit_count       INTEGER     NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    last_hit_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_query_cache_hash       ON query_cache(question_hash);
CREATE INDEX idx_query_cache_expires_at ON query_cache(expires_at);
CREATE INDEX idx_query_cache_hit_count  ON query_cache(hit_count DESC);

-- ── 6. AUDIT LOG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    resource    VARCHAR(100),
    detail      JSONB       DEFAULT '{}',
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id    ON audit_log(user_id);
CREATE INDEX idx_audit_action     ON audit_log(action);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);

-- ── Auto-update updated_at triggers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
