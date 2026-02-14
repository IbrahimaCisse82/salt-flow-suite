import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings, GripVertical, RotateCcw } from "lucide-react";
import { useKPIPreferences } from "@/hooks/useKPIPreferences";
import { cn } from "@/lib/utils";

interface KPICustomizerProps {
  onSave?: () => void;
}

export const KPICustomizer = ({ onSave }: KPICustomizerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { kpiConfigs, toggleKPI, reorderKPIs, resetToDefaults } = useKPIPreferences();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    reorderKPIs(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    if (confirm('Réinitialiser tous les KPIs aux paramètres par défaut ?')) {
      resetToDefaults();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onSave?.();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-white/90 text-foreground border-white/50 hover:bg-white"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Personnaliser</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personnaliser les indicateurs</DialogTitle>
            <DialogDescription>
              Choisissez les KPIs à afficher sur votre tableau de bord et réorganisez-les
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {kpiConfigs.map((kpi, index) => (
              <Card
                key={kpi.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "cursor-move transition-all",
                  draggedIndex === index && "opacity-50",
                  kpi.enabled && "border-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor={kpi.id} className="font-semibold cursor-pointer">
                          {kpi.label}
                        </Label>
                        {kpi.enabled && (
                          <span className="text-xs text-primary font-medium">
                            #{kpi.order}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {kpi.description}
                      </p>
                    </div>

                    <Switch
                      id={kpi.id}
                      checked={kpi.enabled}
                      onCheckedChange={() => toggleKPI(kpi.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            <Button onClick={handleClose} className="bg-gradient-to-r from-primary to-accent">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
