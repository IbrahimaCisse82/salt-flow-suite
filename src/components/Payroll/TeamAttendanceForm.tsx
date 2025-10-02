import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTeams } from "@/hooks/useTeams";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateAttendance } from "@/hooks/useTeamAttendance";

const formSchema = z.object({
  team_id: z.string().min(1, "Sélectionnez une équipe"),
  employee_id: z.string().min(1, "Sélectionnez un employé"),
  attendance_date: z.date(),
  hours_worked: z.string().min(1, "Entrez les heures travaillées"),
  daily_rate: z.string().min(1, "Entrez le taux journalier"),
  notes: z.string().optional(),
});

export function TeamAttendanceForm() {
  const { teams } = useTeams();
  const { data: employees } = useEmployees();
  const createAttendance = useCreateAttendance();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendance_date: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createAttendance.mutateAsync({
      team_id: values.team_id,
      employee_id: values.employee_id,
      attendance_date: format(values.attendance_date, "yyyy-MM-dd"),
      hours_worked: parseFloat(values.hours_worked),
      daily_rate: parseFloat(values.daily_rate),
      notes: values.notes,
      tenant_id: "", // Will be set by the mutation
      validated_by: undefined,
      validated_at: undefined,
    });
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau Pointage</CardTitle>
        <CardDescription>Enregistrer le pointage d'un membre d'équipe</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="team_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une équipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employé</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un employé" />
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

            <FormField
              control={form.control}
              name="attendance_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
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
                          {field.value ? format(field.value, "PPP") : <span>Sélectionnez une date</span>}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hours_worked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heures travaillées</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux journalier (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
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

            <Button type="submit" className="w-full" disabled={createAttendance.isPending}>
              {createAttendance.isPending ? "Enregistrement..." : "Enregistrer le pointage"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
