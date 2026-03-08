-- =============================================
-- Note Explainer - Admin Rules
-- Run this AFTER database/schema.sql
-- =============================================

-- 1) Admin mapping table
CREATE TABLE IF NOT EXISTS public.app_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their own admin record" ON public.app_admins;
CREATE POLICY "Admins can view their own admin record"
    ON public.app_admins
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2) Helper function used by RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(check_user UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.app_admins a
        WHERE a.user_id = check_user
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- 3) Admin read access on operational tables
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.student_profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.student_profiles
    FOR SELECT
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all notes" ON public.notes;
CREATE POLICY "Admins can view all notes"
    ON public.notes
    FOR SELECT
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all AI usage" ON public.ai_token_usage;
CREATE POLICY "Admins can view all AI usage"
    ON public.ai_token_usage
    FOR SELECT
    USING (public.is_admin(auth.uid()));

-- 4) Add your admin user (run after the user already exists in auth.users)
-- Replace email with your real admin login.
INSERT INTO public.app_admins(user_id)
SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com'
ON CONFLICT (user_id) DO NOTHING;
