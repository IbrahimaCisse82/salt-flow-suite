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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold mb-2">{value}</p>
            {change && (
              <p className={cn(
                "text-sm font-medium flex items-center gap-1",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className={cn(
            "rounded-xl p-3",
            gradient 
              ? "bg-gradient-to-br from-primary to-primary-glow" 
              : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              gradient ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
