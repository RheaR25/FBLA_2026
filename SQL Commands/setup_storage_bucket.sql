-- Setup Storage Bucket for Item Photos

-- Create storage bucket for item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone authenticated can upload photos
CREATE POLICY "Anyone authenticated can upload item photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'item-photos' AND
    auth.role() = 'authenticated'
);

-- Policy: Anyone can view item photos (public bucket)
CREATE POLICY "Anyone can view item photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-photos');

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'item-photos' AND
    auth.role() = 'authenticated'
);

