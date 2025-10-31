import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, Mail, Trash2, Plus } from "lucide-react";
import { useScheduledReports, ReportType, ReportFrequency } from "@/hooks/useScheduledReports";
import { cn } from "@/lib/utils";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  campagne: 'Campagne',
  financier: 'Financier',
  production: 'Production',
  rh: 'RH',
  commercial: 'Commercial'
};

const FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel'
};

export const ScheduledReportsManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    report_type: 'campagne' as ReportType,
    frequency: 'monthly' as ReportFrequency,
    schedule_time: '09:00',
    start_date: new Date().toISOString().split('T')[0],
    recipient_emails: ''
  });

  const { scheduledReports, isLoading, createReport, deleteReport, toggleReport } = useScheduledReports();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emails = formData.recipient_emails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      return;
    }

    createReport.mutate({
      report_type: formData.report_type,
      frequency: formData.frequency,
      schedule_time: formData.schedule_time,
      start_date: formData.start_date,
      recipient_emails: emails
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          report_type: 'campagne',
          frequency: 'monthly',
          schedule_time: '09:00',
          start_date: new Date().toISOString().split('T')[0],
          recipient_emails: ''
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport planifié ?')) {
      deleteReport.mutate(id);
    }
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleReport.mutate({ id, isActive: !currentStatus });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Rapports planifiés
            </CardTitle>
            <CardDescription>
              Automatisez la génération et l'envoi de vos rapports
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau rapport
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : scheduledReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun rapport planifié</p>
            <p className="text-sm mt-1">Créez votre premier rapport automatique</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Prochaine exécution</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {REPORT_TYPE_LABELS[report.report_type]}
                    </TableCell>
                    <TableCell>{FREQUENCY_LABELS[report.frequency]}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {report.schedule_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.next_run_at 
                        ? new Date(report.next_run_at).toLocaleString('fr-FR')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {report.recipient_emails.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={report.is_active}
                        onCheckedChange={() => handleToggle(report.id, report.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog de création */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouveau rapport planifié</DialogTitle>
            <DialogDescription>
              Configurez la génération automatique d'un rapport
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Type de rapport</Label>
              <Select
                value={formData.report_type}
                onValueChange={(value) => setFormData({ ...formData, report_type: value as ReportType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value as ReportFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Destinataires (emails séparés par des virgules)</Label>
              <Input
                type="text"
                placeholder="email1@example.com, email2@example.com"
                value={formData.recipient_emails}
                onChange={(e) => setFormData({ ...formData, recipient_emails: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Les rapports seront envoyés automatiquement à ces adresses
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createReport.isPending}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {createReport.isPending ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
