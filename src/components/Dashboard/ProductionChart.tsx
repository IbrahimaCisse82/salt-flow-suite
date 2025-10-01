import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
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

const data = [
  { month: "Jan", production: 0, objectif: 0 },
  { month: "Fév", production: 0, objectif: 0 },
  { month: "Mar", production: 12, objectif: 15 },
  { month: "Avr", production: 28, objectif: 30 },
  { month: "Mai", production: 45, objectif: 50 },
  { month: "Jun", production: 68, objectif: 70 },
  { month: "Jul", production: 92, objectif: 95 },
  { month: "Aoû", production: 78, objectif: 80 },
  { month: "Sep", production: 52, objectif: 55 },
  { month: "Oct", production: 25, objectif: 30 },
  { month: "Nov", production: 8, objectif: 10 },
  { month: "Déc", production: 0, objectif: 0 },
];

export const ProductionChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="break-words">Production mensuelle (tonnes)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
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
            <Line 
              type="monotone" 
              dataKey="objectif" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Objectif"
              dot={{ fill: 'hsl(var(--accent))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
