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

      const { data, error } = await supabase.functions.invoke<WeatherData>('get-weather', {
        body: { lat, lon },
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la récupération de la météo');
      }
      if (!data) {
        throw new Error('Aucune donnée météo disponible');
      }

      return data;
    },
    enabled: !!lat && !!lon,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });
};
