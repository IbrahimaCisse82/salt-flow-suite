import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Breadcrumbs } from "@/components/Layout/Breadcrumbs";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { JournalEntryForm } from "@/components/Accounting/JournalEntryForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const OperationsDiverses = () => {
  const { isOpen } = useSidebar();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  const { data: diversEntries = [] } = useQuery({
    queryKey: ['divers-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          journal_entries:journal_entries(
            *,
            account:chart_of_accounts(account_number, account_name)
          )
        `)
        .eq('transaction_type', 'divers' as any)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", isOpen ? "md:ml-64" : "md:ml-16")}>
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          <Breadcrumbs />

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Écritures diverses</h2>
            <Button 
              className="gap-2 bg-gradient-to-r from-primary to-accent"
              onClick={() => setShowDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Nouvelle écriture
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Régularisations comptables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diversEntries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Aucune écriture diverse enregistrée</p>
                ) : (
                  diversEntries.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{entry.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.transaction_date} {entry.reference && `• Réf: ${entry.reference}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{Number(entry.amount).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                      
                      {entry.journal_entries && (entry.journal_entries as any[]).length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Détail des écritures:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {(entry.journal_entries as any[]).map((line: any) => (
                              <div key={line.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {line.account?.account_number} - {line.account?.account_name}
                                  </span>
                                  {line.description && (
                                    <p className="text-xs text-muted-foreground">{line.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-4 min-w-[200px] justify-end">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Débit</p>
                                    <p className="font-medium">
                                      {Number(line.debit) > 0 ? Number(line.debit).toLocaleString() : '-'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Crédit</p>
                                    <p className="font-medium">
                                      {Number(line.credit) > 0 ? Number(line.credit).toLocaleString() : '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          Note: {entry.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle écriture diverse</DialogTitle>
                <DialogDescription>
                  Saisissez les lignes d'écriture (débit/crédit doivent être équilibrés)
                </DialogDescription>
              </DialogHeader>
              <JournalEntryForm
                onSuccess={() => {
                  setShowDialog(false);
                  queryClient.invalidateQueries({ queryKey: ['divers-entries'] });
                }}
                onCancel={() => setShowDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default OperationsDiverses;
