import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, ThermometerSun, AlertCircle } from "lucide-react";

interface Bassin {
  id: string;
  name: string;
  surface: number;
  status: "active" | "repos" | "maintenance";
  salinity: number;
  waterLevel: number;
}

const bassins: Bassin[] = [
  { id: "B1", name: "Bassin Nord A", surface: 2.5, status: "active", salinity: 28, waterLevel: 85 },
  { id: "B2", name: "Bassin Nord B", surface: 3.0, status: "active", salinity: 32, waterLevel: 78 },
  { id: "B3", name: "Bassin Sud A", surface: 2.8, status: "repos", salinity: 15, waterLevel: 45 },
  { id: "B4", name: "Bassin Sud B", surface: 3.2, status: "maintenance", salinity: 0, waterLevel: 0 },
];

const statusLabels = {
  active: { label: "En production", className: "bg-green-500/10 text-green-700 hover:bg-green-500/20" },
  repos: { label: "Repos", className: "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20" },
  maintenance: { label: "Maintenance", className: "bg-red-500/10 text-red-700 hover:bg-red-500/20" },
};

export const BassinOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          Vue d'ensemble des bassins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bassins.map((bassin) => (
            <div 
              key={bassin.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-lg">{bassin.name}</span>
                  <Badge className={statusLabels[bassin.status].className}>
                    {statusLabels[bassin.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Surface: {bassin.surface} ha
                </p>
              </div>
              
              {bassin.status === "active" && (
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-primary mb-1">
                      <ThermometerSun className="h-4 w-4" />
                      <span className="font-semibold">{bassin.salinity}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Salinité</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-accent mb-1">
                      <Droplets className="h-4 w-4" />
                      <span className="font-semibold">{bassin.waterLevel}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Niveau</p>
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
