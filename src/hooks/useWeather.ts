import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
  };
  forecast: Array<{
    timestamp: number;
    temperature: number;
    description: string;
    icon: string;
  }>;
}

export const useWeather = (lat?: number, lon?: number) => {
  return useQuery<WeatherData>({
    queryKey: ['weather', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        throw new Error('Coordonnées manquantes');
      }

      const response = await fetch(
        `https://mwxybozfksdxrsipywlh.supabase.co/functions/v1/get-weather?lat=${lat}&lon=${lon}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eHlib3pma3NkeHJzaXB5d2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTY2ODgsImV4cCI6MjA3NDkzMjY4OH0.6QMBZk7j6tOL4Z3dkk_1R9TfXimwmgb3rR3i3t0x_38`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la météo');
      }

      return response.json();
    },
    enabled: !!lat && !!lon,
    refetchInterval: 30 * 60 * 1000, // Rafraîchir toutes les 30 minutes
    staleTime: 10 * 60 * 1000, // Considérer les données comme fraîches pendant 10 minutes
  });
};
