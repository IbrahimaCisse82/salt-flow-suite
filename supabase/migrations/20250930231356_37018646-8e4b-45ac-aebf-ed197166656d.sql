-- Create enum type for bassin types
CREATE TYPE bassin_type AS ENUM ('surface_preparatoire', 'table_salante');

-- Add type column to bassins table
ALTER TABLE bassins 
ADD COLUMN type bassin_type NOT NULL DEFAULT 'surface_preparatoire';