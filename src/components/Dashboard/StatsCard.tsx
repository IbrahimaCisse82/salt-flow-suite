import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  gradient?: boolean;
}

export const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  gradient = false 
}: StatsCardProps) => {
  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg",
      gradient && "bg-gradient-to-br from-card to-muted/30"
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">{value}</p>
            {change && (
              <p className={cn(
                "text-xs sm:text-sm font-medium flex items-center gap-1 break-words",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn(
            "rounded-xl p-2 sm:p-3 flex-shrink-0",
            gradient 
              ? "bg-gradient-to-br from-primary to-primary-glow" 
              : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5 sm:h-6 sm:w-6",
              gradient ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
