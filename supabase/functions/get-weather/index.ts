import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth check ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Session invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Input validation ──
    const url = new URL(req.url);
    const latStr = url.searchParams.get('lat');
    const lonStr = url.searchParams.get('lon');

    if (!latStr || !lonStr) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({ error: 'Coordonnées invalides (lat: -90..90, lon: -180..180)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Fetch weather data with sanitized params ──
    const weatherUrl = `${OPEN_METEO_BASE}/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=2`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      await weatherResponse.text(); // consume body
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des données météo' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await weatherResponse.json();
    const current = data.current;
    const daily = data.daily;

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
    const sunriseTs = Math.floor(new Date(daily.sunrise[0]).getTime() / 1000);
    const sunsetTs = Math.floor(new Date(daily.sunset[0]).getTime() / 1000);

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
    return new Response(
      JSON.stringify({ error: 'Une erreur interne est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
