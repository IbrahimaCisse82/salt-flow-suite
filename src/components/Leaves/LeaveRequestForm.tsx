import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLeaves, LeaveType } from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";

const leaveTypes: { value: LeaveType; label: string }[] = [
  { value: "conge_annuel", label: "Congé annuel" },
  { value: "conge_maladie", label: "Congé maladie" },
  { value: "conge_maternite", label: "Congé maternité" },
  { value: "conge_sans_solde", label: "Congé sans solde" },
  { value: "autre", label: "Autre" },
];

const formSchema = z.object({
  employee_id: z.string().min(1, "Sélectionnez un employé"),
  leave_type: z.enum(["conge_annuel", "conge_maladie", "conge_maternite", "conge_sans_solde", "autre"]),
  start_date: z.date({ required_error: "La date de début est requise" }),
  end_date: z.date({ required_error: "La date de fin est requise" }),
  reason: z.string().optional(),
}).refine((data) => data.end_date >= data.start_date, {
  message: "La date de fin doit être après la date de début",
  path: ["end_date"],
});

type FormValues = z.infer<typeof formSchema>;

export const LeaveRequestForm = () => {
  const { createLeave, isCreating } = useLeaves();
  const { data: employees = [] } = useEmployees();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: "",
      leave_type: "conge_annuel",
      reason: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createLeave({
      employee_id: values.employee_id,
      leave_type: values.leave_type,
      start_date: format(values.start_date, 'yyyy-MM-dd'),
      end_date: format(values.end_date, 'yyyy-MM-dd'),
      reason: values.reason,
    });
    form.reset();
  };

  const activeEmployees = employees.filter(e => e.is_active);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} - {employee.position}
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
          name="leave_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de congé</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setStartDateOpen(false);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin</FormLabel>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setEndDateOpen(false);
                      }}
                      disabled={(date) => {
                        const startDate = form.getValues("start_date");
                        return date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                               (startDate && date < startDate);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motif (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez le motif de votre demande..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isCreating} className="w-full">
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Soumettre la demande"
          )}
        </Button>
      </form>
    </Form>
  );
};
