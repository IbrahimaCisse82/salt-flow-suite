
-- Recreate the trigger for automatic journal entry generation on transactions
CREATE TRIGGER trigger_generate_journal_entries
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_journal_entries();
