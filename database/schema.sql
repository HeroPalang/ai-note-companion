-- =============================================
-- Note Explainer - Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Note: Supabase handles email/password authentication automatically
-- in the built-in auth.users table. This schema creates additional
-- tables to store student profile information.

-- =============================================
-- 1. Student Profiles Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    student_id TEXT,
    grade_level TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON public.student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON public.student_profiles(student_id);

-- =============================================
-- 2. Enable Row Level Security (RLS)
-- =============================================
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.student_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.student_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.student_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =============================================
-- 3. Auto-create profile on user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.student_profiles (id, email, first_name, last_name, student_id, grade_level)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'student_id',
        COALESCE(NEW.raw_user_meta_data->>'grade_level', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. Auto-update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 5. Notes Table (for storing user notes)
-- =============================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT,
    explanation TEXT,
    file_url TEXT,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- Add file_url column if it doesn't exist (for uploaded attachments)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Enable RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notes
CREATE POLICY "Users can view own notes"
    ON public.notes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes"
    ON public.notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
    ON public.notes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
    ON public.notes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for notes updated_at
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 6. AI Token Usage Table (per-user quota tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    generate_type TEXT NOT NULL DEFAULT 'explanation',
    prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_created_at
    ON public.ai_token_usage(user_id, created_at DESC);

ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
    ON public.ai_token_usage
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
    ON public.ai_token_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. Storage: Note Attachments Bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder
CREATE POLICY "Users can upload own attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'note-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Anyone can read (public bucket)
CREATE POLICY "Public read access for note attachments"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'note-attachments');

-- Users can delete their own files
CREATE POLICY "Users can delete own attachments"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'note-attachments'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
