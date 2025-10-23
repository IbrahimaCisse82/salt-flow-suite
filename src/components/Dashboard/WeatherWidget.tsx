import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeather } from "@/hooks/useWeather";
import { Cloud, Droplets, Wind, Sun, Sunrise, Sunset, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  location?: string;
}

export const WeatherWidget = ({ latitude, longitude, location = "Votre localisation" }: WeatherWidgetProps) => {
  const { data: weather, isLoading, error } = useWeather(latitude, longitude);

  if (!latitude || !longitude) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Météo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune localisation configurée
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Météo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Météo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Impossible de charger les données météo
          </p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Météo - {location}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {weather && (
          <>
            {/* Météo actuelle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={getWeatherIcon(weather.current.icon)}
                  alt={weather.current.description}
                  className="h-16 w-16"
                />
                <div>
                  <p className="text-3xl font-bold">{weather.current.temperature}°C</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {weather.current.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>Humidité: {weather.current.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span>Vent: {weather.current.wind_speed} m/s</span>
              </div>
              <div className="flex items-center gap-2">
                <Sunrise className="h-4 w-4 text-muted-foreground" />
                <span>Lever: {formatTime(weather.current.sunrise)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sunset className="h-4 w-4 text-muted-foreground" />
                <span>Coucher: {formatTime(weather.current.sunset)}</span>
              </div>
            </div>

            {/* Prévisions */}
            {weather.forecast && weather.forecast.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-semibold mb-2">Prévisions 24h</p>
                <div className="flex gap-2 overflow-x-auto">
                  {weather.forecast.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center min-w-[60px] text-center"
                    >
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp * 1000).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                        })}h
                      </p>
                      <img
                        src={getWeatherIcon(item.icon)}
                        alt={item.description}
                        className="h-8 w-8"
                      />
                      <p className="text-sm font-medium">{item.temperature}°</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
