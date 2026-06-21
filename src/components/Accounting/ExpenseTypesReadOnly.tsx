import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SYSCOHADA_CATEGORIES: Record<string, string> = {
  "60": "Achats",
  "61": "Transports",
  "62": "Services extérieurs A",
  "63": "Services extérieurs B",
  "64": "Impôts et taxes",
  "65": "Autres charges",
  "66": "Charges de personnel",
  "67": "Frais financiers",
  "68": "Dotations aux amortissements",
  "69": "Dotations aux provisions",
};

export const ExpenseTypesReadOnly = () => {
  const { data: expenseTypes, isLoading } = useQuery({
    queryKey: ['expense-types-readonly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_types')
        .select(`
          *,
          account:chart_of_accounts!default_account_id(account_number, account_name)
        `)
        .eq('is_active', true)
        .order('syscohada_category')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Types de Dépenses
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configuration gérée dans le backoffice administrateur
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : !expenseTypes || expenseTypes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Aucun type de dépense configuré</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie SYSCOHADA</TableHead>
                  <TableHead>Compte comptable</TableHead>
                  <TableHead>Observations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseTypes.map((expenseType) => (
                  <TableRow key={expenseType.id}>
                    <TableCell className="font-medium">{expenseType.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {expenseType.syscohada_category} - {SYSCOHADA_CATEGORIES[expenseType.syscohada_category] || "Autre"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expenseType.account ? (
                        `${expenseType.account.account_number} - ${expenseType.account.account_name}`
                      ) : (
                        <span className="text-orange-500">Non lié</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {expenseType.observations || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
