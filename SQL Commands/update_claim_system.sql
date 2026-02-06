-- Update Claim System for Teacher Approval

-- Add claim_status column to track claim approval status
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT NULL CHECK (claim_status IN ('pending', 'approved', 'rejected'));

-- Update claimed_by to allow pending claims (not just approved)
-- The claim_status will track if it's been approved by teacher

-- Create notifications table for student notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_items_claim_status ON items(claim_status);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: System can insert notifications (via authenticated users)
CREATE POLICY "Authenticated users can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Update RLS policy for items - allow claiming but with pending status
DROP POLICY IF EXISTS "Students can claim approved items" ON items;

-- Policy: Students can submit claims (sets claim_status to pending)
CREATE POLICY "Students can submit claims"
    ON items FOR UPDATE
    USING (
        status = 'approved' AND
        (claimed_by IS NULL OR claimed_by = auth.uid()) AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'student'
        )
    )
    WITH CHECK (
        status = 'approved' AND
        (claim_status IS NULL OR claim_status = 'pending')
    );

-- Policy: Teachers can approve/reject claims
CREATE POLICY "Teachers can approve claims"
    ON items FOR UPDATE
    USING (
        claim_status = 'pending' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

