-- Document Analyses table
CREATE TABLE IF NOT EXISTS document_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE UNIQUE,
    document_type TEXT,
    parties JSONB DEFAULT '[]'::jsonb,
    important_dates JSONB DEFAULT '[]'::jsonb,
    important_amounts JSONB DEFAULT '[]'::jsonb,
    obligations JSONB DEFAULT '[]'::jsonb,
    rights JSONB DEFAULT '[]'::jsonb,
    important_clauses JSONB DEFAULT '[]'::jsonb,
    attention_areas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by document_id
CREATE INDEX idx_document_analyses_document_id ON document_analyses(document_id);
