import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Open-Meteo API - free, no API key required
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Current weather + hourly forecast
    const weatherUrl = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=2`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      console.error('Open-Meteo API error:', await weatherResponse.text());
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des données météo' }),
        { status: weatherResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await weatherResponse.json();
    const current = data.current;
    const daily = data.daily;

    // Map WMO weather codes to descriptions and icons
    const getWeatherInfo = (code: number) => {
      const map: Record<number, { description: string; icon: string }> = {
        0: { description: 'Ciel dégagé', icon: '01d' },
        1: { description: 'Principalement dégagé', icon: '02d' },
        2: { description: 'Partiellement nuageux', icon: '03d' },
        3: { description: 'Couvert', icon: '04d' },
        45: { description: 'Brouillard', icon: '50d' },
        48: { description: 'Brouillard givrant', icon: '50d' },
        51: { description: 'Bruine légère', icon: '09d' },
        53: { description: 'Bruine modérée', icon: '09d' },
        55: { description: 'Bruine dense', icon: '09d' },
        61: { description: 'Pluie légère', icon: '10d' },
        63: { description: 'Pluie modérée', icon: '10d' },
        65: { description: 'Pluie forte', icon: '10d' },
        71: { description: 'Neige légère', icon: '13d' },
        73: { description: 'Neige modérée', icon: '13d' },
        75: { description: 'Neige forte', icon: '13d' },
        80: { description: 'Averses légères', icon: '09d' },
        81: { description: 'Averses modérées', icon: '09d' },
        82: { description: 'Averses violentes', icon: '09d' },
        95: { description: 'Orage', icon: '11d' },
        96: { description: 'Orage avec grêle', icon: '11d' },
        99: { description: 'Orage violent avec grêle', icon: '11d' },
      };
      return map[code] || { description: 'Inconnu', icon: '03d' };
    };

    const currentInfo = getWeatherInfo(current.weather_code);

    // Get sunrise/sunset as timestamps
    const sunriseTs = Math.floor(new Date(daily.sunrise[0]).getTime() / 1000);
    const sunsetTs = Math.floor(new Date(daily.sunset[0]).getTime() / 1000);

    // Build hourly forecast (next 8 * 3h slots = 24h)
    const now = new Date();
    const currentHourIndex = data.hourly.time.findIndex((t: string) => new Date(t) >= now);
    const forecastSlots = [];
    for (let i = currentHourIndex; i < Math.min(currentHourIndex + 24, data.hourly.time.length); i += 3) {
      if (i >= 0 && i < data.hourly.time.length) {
        const info = getWeatherInfo(data.hourly.weather_code[i]);
        forecastSlots.push({
          timestamp: Math.floor(new Date(data.hourly.time[i]).getTime() / 1000),
          temperature: Math.round(data.hourly.temperature_2m[i]),
          description: info.description,
          icon: info.icon,
        });
      }
    }

    return new Response(
      JSON.stringify({
        current: {
          temperature: Math.round(current.temperature_2m),
          feels_like: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          pressure: Math.round(current.surface_pressure),
          wind_speed: Math.round(current.wind_speed_10m * 10) / 10,
          description: currentInfo.description,
          icon: currentInfo.icon,
          sunrise: sunriseTs,
          sunset: sunsetTs,
        },
        forecast: forecastSlots,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-weather function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
