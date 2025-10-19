import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMonthlyProductionData } from "@/hooks/useProductionRecords";
import { useCampagnes } from "@/hooks/useCampagnes";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ProductionChart = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const { data: monthlyData = [], isLoading: isLoadingProduction } = useMonthlyProductionData(currentYear);
  const { activeCampagne, isLoading: isLoadingCampagne } = useCampagnes();

  const isLoading = isLoadingProduction || isLoadingCampagne;

  // Calculer l'objectif mensuel basé sur la campagne active
  const monthlyTarget = activeCampagne?.target_production 
    ? Number(activeCampagne.target_production) / 12 
    : 0;

  const chartData = monthlyData.map(item => ({
    ...item,
    objectif: monthlyTarget
  }));

  const hasData = chartData.some(d => d.production > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="break-words">Production mensuelle (tonnes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="break-words">Production mensuelle (tonnes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucune production enregistrée pour {currentYear}
            </p>
            <Button 
              onClick={() => navigate('/production')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer une production
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="break-words">Production mensuelle {currentYear} (tonnes)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="production" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Production réelle"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            {activeCampagne && (
              <Line 
                type="monotone" 
                dataKey="objectif" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Objectif"
                dot={{ fill: 'hsl(var(--accent))' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
