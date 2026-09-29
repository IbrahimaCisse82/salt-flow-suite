DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='journal_entries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
  END IF;
END $$;