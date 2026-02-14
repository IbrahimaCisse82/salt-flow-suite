import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Locate, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MapPickerProps {
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({ 
  onLocationChange, 
  initialLat = 14.7167, 
  initialLng = -17.4677 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  const [manualLat, setManualLat] = useState(initialLat.toFixed(6));
  const [manualLng, setManualLng] = useState(initialLng.toFixed(6));
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [geoError, setGeoError] = useState<string | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=fr&limit=1`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const addr = data.features[0].place_name;
        setAddress(addr);
        return addr;
      }
    } catch {
      // Silently fail reverse geocoding
    }
    return undefined;
  }, [mapboxToken]);

  const updatePosition = useCallback((lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setGeoError(null);

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    }
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 14 });
    }

    reverseGeocode(lat, lng).then((addr) => {
      onLocationChange(lat, lng, addr);
    });
  }, [onLocationChange, reverseGeocode]);

  const handleDetectPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par votre navigateur.');
      toast.error('Géolocalisation non supportée par votre navigateur.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        updatePosition(position.coords.latitude, position.coords.longitude);
        toast.success('Position détectée avec succès');
      },
      (error) => {
        setIsLocating(false);
        let msg: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Accès à la localisation refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Position GPS indisponible. Vérifiez que votre GPS est activé.';
            break;
          case error.TIMEOUT:
            msg = 'Délai de localisation expiré. Vérifiez votre connexion.';
            break;
          default:
            msg = 'Erreur de géolocalisation inconnue.';
        }
        setGeoError(msg);
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [updatePosition]);

  const handleManualLatChange = (value: string) => {
    setManualLat(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= -90 && num <= 90) {
      const lng = coordinates.lng;
      updatePosition(num, lng);
    }
  };

  const handleManualLngChange = (value: string) => {
    setManualLng(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= -180 && num <= 180) {
      const lat = coordinates.lat;
      updatePosition(lat, num);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [initialLng, initialLat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    marker.current = new mapboxgl.Marker({ draggable: true, color: '#0ea5e9' })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        setCoordinates({ lat: lngLat.lat, lng: lngLat.lng });
        setManualLat(lngLat.lat.toFixed(6));
        setManualLng(lngLat.lng.toFixed(6));
        reverseGeocode(lngLat.lat, lngLat.lng).then((addr) => {
          onLocationChange(lngLat.lat, lngLat.lng, addr);
        });
      }
    });

    map.current.on('click', (e) => {
      if (marker.current) {
        marker.current.setLngLat(e.lngLat);
        setCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        setManualLat(e.lngLat.lat.toFixed(6));
        setManualLng(e.lngLat.lng.toFixed(6));
        reverseGeocode(e.lngLat.lat, e.lngLat.lng).then((addr) => {
          onLocationChange(e.lngLat.lat, e.lngLat.lng, addr);
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, initialLat, initialLng]);

  return (
    <div className="space-y-3">
      {/* Detect position button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleDetectPosition}
        disabled={isLocating}
        className="w-full gap-2"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Locate className="h-4 w-4" />
        )}
        {isLocating ? 'Détection en cours...' : 'Détecter ma position'}
      </Button>

      {/* Error message */}
      {geoError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map */}
      <div className="relative h-[300px] w-full rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
          <p className="text-xs font-medium flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            Cliquez ou glissez le marqueur
          </p>
        </div>
      </div>

      {/* Address display */}
      {address && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5 border">
          <span className="font-medium">Adresse : </span>{address}
        </div>
      )}

      {/* Manual coordinate inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input 
            type="number" 
            step="0.000001"
            min="-90"
            max="90"
            value={manualLat} 
            onChange={(e) => handleManualLatChange(e.target.value)}
            className="text-sm"
            placeholder="Ex: 14.716700"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input 
            type="number" 
            step="0.000001"
            min="-180"
            max="180"
            value={manualLng} 
            onChange={(e) => handleManualLngChange(e.target.value)}
            className="text-sm"
            placeholder="Ex: -17.467700"
          />
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
