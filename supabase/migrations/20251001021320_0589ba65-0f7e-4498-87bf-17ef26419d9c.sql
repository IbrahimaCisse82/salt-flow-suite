-- Ajouter 'divers' au type transaction_type s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'divers' 
        AND enumtypid = 'transaction_type'::regtype
    ) THEN
        ALTER TYPE transaction_type ADD VALUE 'divers';
    END IF;
END$$;