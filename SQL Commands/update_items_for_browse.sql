-- Update items table for browse functionality

-- Add photo/image URL column
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add claim tracking columns
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claim_proof TEXT,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Create index for better filtering
CREATE INDEX IF NOT EXISTS idx_items_claimed_by ON items(claimed_by);
CREATE INDEX IF NOT EXISTS idx_items_approved ON items(status) WHERE status = 'approved';

-- Update RLS policies to allow viewing approved items
-- Drop existing select policies first
DROP POLICY IF EXISTS "Students can view own items" ON items;
DROP POLICY IF EXISTS "Teachers can view all items" ON items;

-- Policy: Anyone authenticated can view approved items
CREATE POLICY "Anyone can view approved items"
    ON items FOR SELECT
    USING (
        status = 'approved' AND
        auth.role() = 'authenticated'
    );

-- Policy: Students can view their own items (all statuses)
CREATE POLICY "Students can view own items"
    ON items FOR SELECT
    USING (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- Policy: Teachers can view all items
CREATE POLICY "Teachers can view all items"
    ON items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Policy: Students can update items to claim them
CREATE POLICY "Students can claim approved items"
    ON items FOR UPDATE
    USING (
        status = 'approved' AND
        claimed_by IS NULL AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'student'
        )
    )
    WITH CHECK (
        status = 'approved' AND
        (claimed_by = auth.uid() OR claimed_by IS NULL)
    );

