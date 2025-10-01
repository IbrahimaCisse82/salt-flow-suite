import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, ThermometerSun, AlertCircle } from "lucide-react";

interface Bassin {
  id: string;
  name: string;
  type: "surface_preparatoire" | "table_salante";
  surface: number;
  status: "active" | "repos" | "maintenance";
  salinity: number;
  waterLevel: number;
}

const bassins: Bassin[] = [
  { id: "B1", name: "Bassin Nord A", type: "surface_preparatoire", surface: 2.5, status: "active", salinity: 28, waterLevel: 85 },
  { id: "B2", name: "Bassin Nord B", type: "table_salante", surface: 3.0, status: "active", salinity: 32, waterLevel: 78 },
  { id: "B3", name: "Bassin Sud A", type: "surface_preparatoire", surface: 2.8, status: "repos", salinity: 15, waterLevel: 45 },
  { id: "B4", name: "Bassin Sud B", type: "table_salante", surface: 3.2, status: "maintenance", salinity: 0, waterLevel: 0 },
];

const bassinTypeLabels = {
  surface_preparatoire: "Surface préparatoire",
  table_salante: "Table salante",
};

const statusLabels = {
  active: { label: "En production", className: "bg-green-500/10 text-green-700 hover:bg-green-500/20" },
  repos: { label: "Repos", className: "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20" },
  maintenance: { label: "Maintenance", className: "bg-red-500/10 text-red-700 hover:bg-red-500/20" },
};

export const BassinOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="truncate">Vue d'ensemble des bassins</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          {bassins.map((bassin) => (
            <div 
              key={bassin.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="font-semibold text-base sm:text-lg truncate">{bassin.name}</span>
                  <Badge className={`${statusLabels[bassin.status].className} flex-shrink-0`}>
                    {statusLabels[bassin.status].label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <p className="text-muted-foreground">
                    Surface: {bassin.surface} ha
                  </p>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium text-primary break-words">
                    {bassinTypeLabels[bassin.type]}
                  </span>
                </div>
              </div>
              
              {bassin.status === "active" && (
                <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm justify-start sm:justify-end">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-primary mb-1">
                      <ThermometerSun className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-semibold">{bassin.salinity}%</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Salinité</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-accent mb-1">
                      <Droplets className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="font-semibold">{bassin.waterLevel}%</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Niveau</p>
                  </div>
                </div>
              )}
              
              {bassin.status === "maintenance" && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">En maintenance</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
