import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTenants } from "@/hooks/useTenants";

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: any;
}

export const TenantForm = ({ open, onOpenChange, tenant }: TenantFormProps) => {
  const { createTenant, updateTenant, isCreating, isUpdating } = useTenants();
  
  const form = useForm({
    defaultValues: {
      name: tenant?.name || '',
      subdomain: tenant?.subdomain || '',
      contact_email: tenant?.contact_email || '',
      contact_phone: tenant?.contact_phone || '',
      address: tenant?.address || '',
      manager_name: tenant?.manager_name || '',
      rccm: tenant?.rccm || '',
      ninea: tenant?.ninea || '',
      is_active: tenant?.is_active ?? true
    }
  });

  const onSubmit = (data: any) => {
    if (tenant?.id) {
      updateTenant({ id: tenant.id, ...data });
    } else {
      createTenant(data);
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom de l'entreprise *</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sous-domaine</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="entreprise" />
                    </FormControl>
                    <FormDescription>
                      URL: entreprise.gsuite.app
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manager_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du gestionnaire</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contact</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rccm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RCCM</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ninea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NINEA</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
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
