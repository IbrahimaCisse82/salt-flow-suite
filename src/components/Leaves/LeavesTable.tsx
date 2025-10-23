import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, Ban, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLeaves, Leave, LeaveStatus } from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";

const leaveTypeLabels: Record<string, string> = {
  conge_annuel: "Congé annuel",
  conge_maladie: "Congé maladie",
  conge_maternite: "Congé maternité",
  conge_sans_solde: "Congé sans solde",
  autre: "Autre",
};

const statusConfig: Record<LeaveStatus, { label: string; icon: any; variant: any }> = {
  pending: { label: "En attente", icon: Clock, variant: "secondary" },
  approved: { label: "Approuvé", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejeté", icon: XCircle, variant: "destructive" },
  cancelled: { label: "Annulé", icon: Ban, variant: "outline" },
};

export const LeavesTable = () => {
  const { leaves, updateLeaveStatus, deleteLeave, isUpdating, isDeleting } = useLeaves();
  const { data: employees = [] } = useEmployees();
  const { profile } = useAuth();
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const isManager = profile?.role === 'admin' || profile?.role === 'gerant';

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.full_name || "Inconnu";
  };

  const handleAction = async () => {
    if (!selectedLeave) return;

    try {
      if (actionType === 'delete') {
        await deleteLeave(selectedLeave.id);
      } else if (actionType === 'approve') {
        await updateLeaveStatus({ id: selectedLeave.id, status: 'approved' });
      } else if (actionType === 'reject') {
        await updateLeaveStatus({ 
          id: selectedLeave.id, 
          status: 'rejected',
          rejection_reason: rejectionReason 
        });
      }
    } finally {
      setSelectedLeave(null);
      setActionType(null);
      setRejectionReason("");
    }
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune demande de congé
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Début</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Jours</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Demandé le</TableHead>
              {isManager && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => {
              const StatusIcon = statusConfig[leave.status].icon;
              return (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">
                    {getEmployeeName(leave.employee_id)}
                  </TableCell>
                  <TableCell>{leaveTypeLabels[leave.leave_type]}</TableCell>
                  <TableCell>
                    {format(new Date(leave.start_date), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(leave.end_date), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>{leave.days_count}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[leave.status].variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[leave.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(leave.requested_at), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  {isManager && (
                    <TableCell className="text-right space-x-2">
                      {leave.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setActionType('approve');
                            }}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setActionType('reject');
                            }}
                            disabled={isUpdating}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setActionType('delete');
                        }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' && "Approuver la demande"}
              {actionType === 'reject' && "Rejeter la demande"}
              {actionType === 'delete' && "Supprimer la demande"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' && 
                "Êtes-vous sûr de vouloir approuver cette demande de congé ?"}
              {actionType === 'reject' && (
                <div className="space-y-3">
                  <p>Veuillez indiquer la raison du rejet :</p>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Raison du rejet..."
                    rows={3}
                  />
                </div>
              )}
              {actionType === 'delete' && 
                "Êtes-vous sûr de vouloir supprimer définitivement cette demande ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionType === 'reject' && !rejectionReason.trim()}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
