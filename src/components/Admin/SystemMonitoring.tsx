import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, Server, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function SystemMonitoring() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_metrics' as any)
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as any[];
    },
  });

  const getAverageMetric = (metricName: string) => {
    if (!metrics) return 0;
    const filtered = metrics.filter(m => m.metric_name === metricName);
    if (filtered.length === 0) return 0;
    return filtered.reduce((acc, m) => acc + Number(m.metric_value), 0) / filtered.length;
  };

  const systemHealth = [
    { 
      label: "CPU Usage", 
      value: getAverageMetric('cpu_usage'), 
      icon: Server, 
      status: getAverageMetric('cpu_usage') > 80 ? 'critical' : 'healthy'
    },
    { 
      label: "Memory Usage", 
      value: getAverageMetric('memory_usage'), 
      icon: Database, 
      status: getAverageMetric('memory_usage') > 85 ? 'critical' : 'healthy'
    },
    { 
      label: "API Response Time", 
      value: getAverageMetric('api_response_time'), 
      icon: Activity, 
      status: getAverageMetric('api_response_time') > 1000 ? 'warning' : 'healthy',
      unit: 'ms'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Monitoring Système</h2>
        <p className="text-muted-foreground">Surveillance en temps réel de la santé du système</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {systemHealth.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">
                    {metric.value.toFixed(1)}{metric.unit || '%'}
                  </div>
                  <Badge variant={
                    metric.status === 'critical' ? 'destructive' : 
                    metric.status === 'warning' ? 'secondary' : 
                    'default'
                  }>
                    {metric.status}
                  </Badge>
                </div>
                <Progress value={metric.unit ? undefined : metric.value} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertes Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement des alertes...</p>
          ) : (
            <div className="space-y-3">
              {systemHealth.filter(m => m.status !== 'healthy').length === 0 ? (
                <p className="text-muted-foreground">Aucune alerte - Tous les systèmes fonctionnent normalement</p>
              ) : (
                systemHealth.filter(m => m.status !== 'healthy').map(metric => (
                  <div key={metric.label} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className={metric.status === 'critical' ? 'h-5 w-5 text-destructive' : 'h-5 w-5 text-orange-500'} />
                      <div>
                        <p className="font-medium">{metric.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Valeur actuelle: {metric.value.toFixed(1)}{metric.unit || '%'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={metric.status === 'critical' ? 'destructive' : 'secondary'}>
                      {metric.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
