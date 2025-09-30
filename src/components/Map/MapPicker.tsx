import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface MapPickerProps {
  onLocationChange: (lat: number, lng: number) => void;
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
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [initialLng, initialLat],
      zoom: 12,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Create a draggable marker
    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Update coordinates on drag
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        setCoordinates({ lat: lngLat.lat, lng: lngLat.lng });
        onLocationChange(lngLat.lat, lngLat.lng);
      }
    });

    // Add click handler to move marker
    map.current.on('click', (e) => {
      if (marker.current) {
        marker.current.setLngLat(e.lngLat);
        setCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        onLocationChange(e.lngLat.lat, e.lngLat.lng);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, initialLat, initialLng, onLocationChange]);

  if (!mapboxToken) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
          <MapPin className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Token Mapbox requis</p>
            <p className="text-xs text-muted-foreground">
              Obtenez votre token sur{' '}
              <a 
                href="https://mapbox.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapbox-token">Token Mapbox Public</Label>
          <Input
            id="mapbox-token"
            type="text"
            placeholder="pk.eyJ1..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[300px] w-full rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
          <p className="text-xs font-medium flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" />
            Cliquez sur la carte pour placer le marqueur
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input 
            type="number" 
            step="0.000001"
            value={coordinates.lat.toFixed(6)} 
            readOnly 
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input 
            type="number" 
            step="0.000001"
            value={coordinates.lng.toFixed(6)} 
            readOnly 
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
