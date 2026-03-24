import { ShoppingCart, FileText, Truck, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStepperProps {
  draftCount: number;
  invoicedCount: number;
  deliverableCount: number;
  deliveredCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const steps = [
  { key: "commandes", label: "Commandes", sublabel: "Créer & valider", icon: ShoppingCart, countKey: "draftCount" as const },
  { key: "facturation", label: "Facturation", sublabel: "Facturer & encaisser", icon: FileText, countKey: "invoicedCount" as const },
  { key: "livraison", label: "Livraison", sublabel: "Expédier au client", icon: Truck, countKey: "deliverableCount" as const },
];

export const WorkflowStepper = ({
  draftCount,
  invoicedCount,
  deliverableCount,
  deliveredCount,
  activeTab,
  onTabChange,
}: WorkflowStepperProps) => {
  const counts = { draftCount, invoicedCount, deliverableCount };

  return (
    <div className="bg-card border rounded-xl p-4">
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        Flux de vente
      </p>
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const count = counts[step.countKey];
          const isActive = activeTab === step.key;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <button
                onClick={() => onTabChange(step.key)}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg w-full transition-all",
                  "hover:bg-accent/50 cursor-pointer",
                  isActive && "bg-primary/10 ring-1 ring-primary/30"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : count > 0
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
                      {step.label}
                    </span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{step.sublabel}</p>
                </div>
                {/* Mobile count badge */}
                <div className="sm:hidden">
                  {count > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold bg-destructive/15 text-destructive">
                      {count}
                    </span>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-0.5 hidden sm:block" />
              )}
            </div>
          );
        })}

        {/* Completed summary */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l ml-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium">{deliveredCount}</span>
            <p className="text-xs text-muted-foreground">Terminées</p>
          </div>
        </div>
      </div>
    </div>
  );
};
