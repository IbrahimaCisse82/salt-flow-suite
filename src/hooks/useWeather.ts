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

      // Use supabase.functions.invoke for automatic auth token
      const { data, error } = await supabase.functions.invoke('get-weather', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });

      // supabase.functions.invoke doesn't support query params natively,
      // so we use fetch with the user's session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Session requise pour accéder à la météo');
      }

      const response = await fetch(
        `https://mwxybozfksdxrsipywlh.supabase.co/functions/v1/get-weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Erreur lors de la récupération de la météo');
      }

      return response.json();
    },
    enabled: !!lat && !!lon,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });
};
