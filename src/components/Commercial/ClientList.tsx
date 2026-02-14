import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Phone } from "lucide-react";
import { ListSkeleton } from "@/components/LoadingSkeletons/ListSkeleton";

interface ClientListProps {
  clients: any[];
  isLoading: boolean;
  onViewDetails: (client: any) => void;
  onEdit: (client: any) => void;
  onDelete: (clientId: string) => void;
  onNewClient: () => void;
}

export const ClientList = ({
  clients,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onNewClient,
}: ClientListProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Liste des clients</CardTitle>
      <Button onClick={onNewClient}>
        <Plus className="h-4 w-4 mr-2" />
        Nouveau client
      </Button>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <ListSkeleton items={4} showAvatar={false} />
      ) : clients.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Aucun client enregistré</p>
      ) : (
        <div className="space-y-4">
          {clients.map((client: any) => (
            <div key={client.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-semibold">{client.name}</p>
                  <Badge variant="outline">
                    {client.client_type === 'local' ? 'Local' : 'Export'}
                  </Badge>
                  {client.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {client.phone}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(client)}>
                    Détails
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(client.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
