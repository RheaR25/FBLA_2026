-- Create users table to store user profiles and roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Service role can insert (for signup)
-- Note: handled by Supabase Auth triggers in production

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        'student' -- Default role, can be updated if needed
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Policy: Teachers can view all user profiles (for student directory)
CREATE POLICY "Teachers can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Create items table for posts/claims
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on student_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_items_student_id ON items(student_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- Enable Row Level Security on items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own items
CREATE POLICY "Students can view own items"
    ON items FOR SELECT
    USING (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- Policy: Students can insert their own items
CREATE POLICY "Students can insert own items"
    ON items FOR INSERT
    WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- Policy: Students can update their own items (only if pending)
CREATE POLICY "Students can update own pending items"
    ON items FOR UPDATE
    USING (
        student_id = auth.uid() AND
        status = 'pending' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'student'
        )
    )
    WITH CHECK (
        student_id = auth.uid()
    );

-- Policy: Teachers can view all items (for approval)
CREATE POLICY "Teachers can view all items"
    ON items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Policy: Teachers can update items (for approval/rejection)
CREATE POLICY "Teachers can update items"
    ON items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Create trigger to update updated_at on items
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
