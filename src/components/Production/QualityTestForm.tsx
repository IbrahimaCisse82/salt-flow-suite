import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQualityTests } from "@/hooks/useQualityTests";

interface QualityTestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionRecordId?: string;
  test?: any;
}

export const QualityTestForm = ({ open, onOpenChange, productionRecordId, test }: QualityTestFormProps) => {
  const { createTest, updateTest, isCreating, isUpdating } = useQualityTests();
  
  const form = useForm({
    defaultValues: {
      production_record_id: test?.production_record_id || productionRecordId || '',
      humidity_level: test?.humidity_level || '',
      salt_purity: test?.salt_purity || '',
      grain_size: test?.grain_size || '',
      color_grade: test?.color_grade || '',
      impurities_level: test?.impurities_level || '',
      quality_status: test?.quality_status || 'pending',
      quality_score: test?.quality_score || '',
      batch_number: test?.batch_number || '',
      notes: test?.notes || '',
      corrective_actions: test?.corrective_actions || ''
    }
  });

  const onSubmit = (data: any) => {
    if (test?.id) {
      updateTest({ id: test.id, ...data });
    } else {
      createTest(data);
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test ? 'Modifier le test' : 'Nouveau test qualité'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="humidity_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux d'humidité (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salt_purity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pureté du sel (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grain_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille des grains</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fin">Fin</SelectItem>
                        <SelectItem value="moyen">Moyen</SelectItem>
                        <SelectItem value="gros">Gros</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color_grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade de couleur</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blanc">Blanc</SelectItem>
                        <SelectItem value="gris">Gris</SelectItem>
                        <SelectItem value="rose">Rose</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impurities_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau d'impuretés (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quality_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score qualité (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quality_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="passed">Conforme</SelectItem>
                        <SelectItem value="failed">Non conforme</SelectItem>
                        <SelectItem value="conditional">Conditionnel</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de lot</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="corrective_actions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actions correctives</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
