import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Calendar, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  sale_date: string;
  delivery_date: string;
  total_amount: number;
  amount_paid: number;
  days_overdue: number;
}

export const AutomaticReminders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les factures en retard
  const { data: overdueInvoices = [], isLoading } = useQuery<OverdueInvoice[]>({
    queryKey: ['overdue-invoices'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          sale_date,
          delivery_date,
          total_amount,
          amount_paid,
          client:clients(name, email)
        `)
        .neq('payment_status', 'paid')
        .lt('delivery_date', today)
        .order('delivery_date');

      if (error) throw error;

      return (data || []).map(sale => {
        const deliveryDate = new Date(sale.delivery_date);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - deliveryDate.getTime();
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: sale.id,
          invoice_number: sale.invoice_number || `INV-${sale.id.slice(0, 6)}`,
          client_name: sale.client?.name || 'N/A',
          client_email: sale.client?.email || '',
          sale_date: sale.sale_date,
          delivery_date: sale.delivery_date,
          total_amount: Number(sale.total_amount),
          amount_paid: Number(sale.amount_paid || 0),
          days_overdue: daysOverdue
        };
      }).filter(inv => inv.days_overdue > 0);
    },
    refetchInterval: 5 * 60 * 1000 // Rafraîchir toutes les 5 minutes
  });

  // Mutation pour envoyer une relance
  const sendReminderMutation = useMutation({
    mutationFn: async (invoice: OverdueInvoice) => {
      // Simuler l'envoi d'email (à remplacer par une vraie intégration email)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Enregistrer la relance dans les notes de la vente
      const { error } = await supabase
        .from('sales')
        .update({
          notes: `Relance envoyée le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`
        })
        .eq('id', invoice.id);

      if (error) throw error;
    },
    onSuccess: (_, invoice) => {
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      toast({
        title: "Relance envoyée",
        description: `Relance envoyée à ${invoice.client_name}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la relance",
        variant: "destructive"
      });
    }
  });

  const sendReminder = (invoice: OverdueInvoice) => {
    sendReminderMutation.mutate(invoice);
  };

  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue > 30) return "bg-destructive text-destructive-foreground";
    if (daysOverdue > 15) return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20";
    return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
  };

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Relances Automatiques
            </CardTitle>
            <CardDescription>
              Suivi et gestion des factures en retard
            </CardDescription>
          </div>
          {overdueInvoices.length > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {overdueInvoices.length} en retard
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : overdueInvoices.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune facture en retard</p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Montant total en retard</span>
                <span className="text-2xl font-bold text-destructive">
                  {totalOverdue.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{invoice.client_name}</p>
                        <Badge className={getSeverityColor(invoice.days_overdue)}>
                          {invoice.days_overdue} jour{invoice.days_overdue > 1 ? 's' : ''} de retard
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Facture {invoice.invoice_number} • Échéance: {format(new Date(invoice.delivery_date), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-destructive">
                        {(invoice.total_amount - invoice.amount_paid).toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sur {invoice.total_amount.toLocaleString()} FCFA
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendReminder(invoice)}
                      disabled={sendReminderMutation.isPending}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Relancer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
