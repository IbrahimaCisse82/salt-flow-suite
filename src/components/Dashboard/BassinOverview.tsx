import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Plus } from "lucide-react";
import { useBassins } from "@/hooks/useBassins";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels = {
  active: { label: "Actif", className: "bg-green-500/10 text-green-700 hover:bg-green-500/20" },
  inactive: { label: "Inactif", className: "bg-gray-500/10 text-gray-700 hover:bg-gray-500/20" },
};

export const BassinOverview = () => {
  const { bassins, isLoading } = useBassins();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Vue d'ensemble des bassins</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bassins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Vue d'ensemble des bassins</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucun bassin enregistré pour le moment
            </p>
            <Button 
              onClick={() => navigate('/bassins')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un bassin
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeBassins = bassins.filter(b => b.is_active);
  const displayBassins = bassins.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">Bassins ({activeBassins.length} actifs)</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/bassins')}
          >
            Voir tout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          {displayBassins.map((bassin) => (
            <div 
              key={bassin.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-3 cursor-pointer"
              onClick={() => navigate('/bassins')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="font-semibold text-base sm:text-lg truncate">{bassin.name}</span>
                  <Badge className={statusLabels[bassin.is_active ? 'active' : 'inactive'].className}>
                    {statusLabels[bassin.is_active ? 'active' : 'inactive'].label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  {bassin.code && (
                    <>
                      <p className="text-muted-foreground">
                        Code: {bassin.code}
                      </p>
                      <span className="text-muted-foreground">•</span>
                    </>
                  )}
                  {bassin.area && (
                    <p className="text-muted-foreground">
                      Surface: {bassin.area} ha
                    </p>
                  )}
                  {bassin.location && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-medium text-primary break-words">
                        {bassin.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
