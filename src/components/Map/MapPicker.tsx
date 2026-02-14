import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Locate, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerProps {
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({
  onLocationChange,
  initialLat = 14.7167,
  initialLng = -17.4677,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  const [manualLat, setManualLat] = useState(initialLat.toFixed(6));
  const [manualLng, setManualLng] = useState(initialLng.toFixed(6));
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [geoError, setGeoError] = useState<string | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
        return data.display_name;
      }
    } catch {
      // Silently fail
    }
    return undefined;
  }, []);

  const updatePosition = useCallback(
    (lat: number, lng: number) => {
      setCoordinates({ lat, lng });
      setManualLat(lat.toFixed(6));
      setManualLng(lng.toFixed(6));
      setGeoError(null);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 15);
      }

      reverseGeocode(lat, lng).then((addr) => {
        onLocationChange(lat, lng, addr);
      });
    },
    [onLocationChange, reverseGeocode]
  );

  const handleDetectPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      toast.error('Géolocalisation non supportée.');
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
            msg = "Accès à la localisation refusé. Veuillez autoriser l'accès dans les paramètres.";
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
      updatePosition(num, coordinates.lng);
    }
  };

  const handleManualLngChange = (value: string) => {
    setManualLng(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= -180 && num <= 180) {
      updatePosition(coordinates.lat, num);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current).setView([initialLat, initialLng], 12);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCoordinates({ lat: pos.lat, lng: pos.lng });
      setManualLat(pos.lat.toFixed(6));
      setManualLng(pos.lng.toFixed(6));
      reverseGeocode(pos.lat, pos.lng).then((addr) => {
        onLocationChange(pos.lat, pos.lng, addr);
      });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      setManualLat(e.latlng.lat.toFixed(6));
      setManualLng(e.latlng.lng.toFixed(6));
      reverseGeocode(e.latlng.lat, e.latlng.lng).then((addr) => {
        onLocationChange(e.latlng.lat, e.latlng.lng, addr);
      });
    });

    // Force a resize after render to fix grey tiles
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialLat, initialLng]);

  return (
    <div className="space-y-3">
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

      {geoError && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      <div className="relative h-[300px] w-full rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0 z-0" />
        <div className="absolute top-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
          <p className="text-xs font-medium flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            Cliquez ou glissez le marqueur
          </p>
        </div>
      </div>

      {address && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5 border">
          <span className="font-medium">Adresse : </span>
          {address}
        </div>
      )}

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
