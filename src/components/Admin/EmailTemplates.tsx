import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function EmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase
        .from('email_templates' as any)
        .insert(template);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template créé');
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase
        .from('email_templates' as any)
        .update(template)
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template mis à jour');
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template supprimé');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const template = {
      template_key: formData.get('template_key'),
      subject: formData.get('subject'),
      body_html: formData.get('body_html'),
      body_text: formData.get('body_text'),
      variables: JSON.parse(formData.get('variables') as string || '[]'),
    };

    if (selectedTemplate) {
      updateMutation.mutate({ ...template, id: selectedTemplate.id });
    } else {
      createMutation.mutate(template);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Templates d'Emails
          </h2>
          <p className="text-muted-foreground">Gérer les modèles d'emails système</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Modifier le Template' : 'Créer un Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Clé du Template</Label>
                <Input 
                  name="template_key" 
                  required
                  defaultValue={selectedTemplate?.template_key}
                  placeholder="welcome_email"
                />
              </div>
              <div className="space-y-2">
                <Label>Sujet</Label>
                <Input 
                  name="subject" 
                  required
                  defaultValue={selectedTemplate?.subject}
                  placeholder="Bienvenue sur SaltERP"
                />
              </div>
              <div className="space-y-2">
                <Label>Corps HTML</Label>
                <Textarea 
                  name="body_html" 
                  required
                  rows={8}
                  defaultValue={selectedTemplate?.body_html}
                  placeholder="<h1>Bienvenue {{user_name}}</h1>"
                />
              </div>
              <div className="space-y-2">
                <Label>Corps Texte Brut</Label>
                <Textarea 
                  name="body_text" 
                  required
                  rows={6}
                  defaultValue={selectedTemplate?.body_text}
                  placeholder="Bienvenue {{user_name}}"
                />
              </div>
              <div className="space-y-2">
                <Label>Variables (JSON)</Label>
                <Textarea 
                  name="variables"
                  defaultValue={JSON.stringify(selectedTemplate?.variables || [], null, 2)}
                  placeholder='["user_name", "company_name"]'
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedTemplate ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">Chargement...</CardContent>
          </Card>
        ) : templates?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Aucun template d'email. Créez-en un pour commencer.</p>
            </CardContent>
          </Card>
        ) : (
          templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.template_key}</CardTitle>
                    <CardDescription>{template.subject}</CardDescription>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.body_text}
                  </p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v: string) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
