-- Fix RLS Policies for users table - Version 2
-- This fixes circular dependency issues

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Teachers can view all users" ON users;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Teachers can view all user profiles
-- This uses a function to avoid circular dependency
CREATE OR REPLACE FUNCTION public.is_teacher(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = user_id AND role = 'teacher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Teachers can view all users"
    ON users FOR SELECT
    USING (
        auth.uid() = id OR  -- Users can always see themselves
        public.is_teacher(auth.uid())  -- Teachers can see everyone
    );

