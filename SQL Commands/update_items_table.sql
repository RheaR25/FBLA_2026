-- Update items table to include color, size, and location fields

-- Add new columns to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS size TEXT;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_items_color ON items(color);
CREATE INDEX IF NOT EXISTS idx_items_size ON items(size);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);

