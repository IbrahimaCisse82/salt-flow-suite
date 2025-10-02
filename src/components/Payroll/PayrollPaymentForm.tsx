import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeamAttendance } from "@/hooks/useTeamAttendance";
import { useCreatePayrollPayment } from "@/hooks/usePayrollPayments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  attendance_id: z.string().min(1, "Sélectionnez un pointage validé"),
  paid_amount: z.string().min(1, "Entrez le montant payé"),
  paid_to: z.string().min(1, "Sélectionnez l'employé"),
  payment_account_id: z.string().min(1, "Sélectionnez le compte de paiement"),
  payment_date: z.date(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

export function PayrollPaymentForm() {
  const { data: employees } = useEmployees();
  const { data: validatedAttendances } = useTeamAttendance({ status: 'validated' });
  const createPayment = useCreatePayrollPayment();

  // Récupérer les comptes de trésorerie
  const { data: accounts } = useQuery({
    queryKey: ['treasury-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .in('account_type', ['Banque', 'Caisse'])
        .order('account_name');
      
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_date: new Date(),
      payment_method: "Espèces",
    },
  });

  const selectedAttendance = validatedAttendances?.find(
    a => a.id === form.watch('attendance_id')
  );

  const paidAmount = parseFloat(form.watch('paid_amount') || '0');
  const totalAmount = selectedAttendance?.calculated_amount || 0;
  const balanceDue = totalAmount - paidAmount;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createPayment.mutateAsync({
      tenant_id: "", // Will be set by the mutation
      attendance_id: values.attendance_id,
      paid_amount: parseFloat(values.paid_amount),
      balance_due: balanceDue,
      paid_to: values.paid_to,
      payment_account_id: values.payment_account_id,
      payment_date: format(values.payment_date, "yyyy-MM-dd"),
      payment_method: values.payment_method,
      receiver_signature: undefined,
      notes: values.notes,
    });
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement de Salaire</CardTitle>
        <CardDescription>Enregistrer un paiement RH</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="attendance_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pointage validé</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un pointage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {validatedAttendances?.map((attendance) => (
                        <SelectItem key={attendance.id} value={attendance.id}>
                          {attendance.employees?.full_name} - {format(new Date(attendance.attendance_date), "dd/MM/yyyy")} - {attendance.calculated_amount.toLocaleString()} FCFA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedAttendance && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Montant total:</span>
                      <span className="font-medium">{totalAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Heures: {selectedAttendance.hours_worked}h × {selectedAttendance.daily_rate.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="paid_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payé à</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez l'employé" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} ({employee.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant payé (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="40000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte de paiement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Compte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {balanceDue > 0 && paidAmount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Reliquat à verser: {balanceDue.toLocaleString()} FCFA</div>
                  <div className="text-sm mt-1">Un montant de {balanceDue.toLocaleString()} FCFA reste à payer</div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de paiement</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de paiement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Virement">Virement</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                        <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observations..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createPayment.isPending}>
              {createPayment.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
