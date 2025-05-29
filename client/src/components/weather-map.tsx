import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { ForecastRecord } from "@/types/weather";

interface WeatherMapProps {
  forecasts: ForecastRecord[];
  showRainfall: boolean;
  onToggleRainfall: () => void;
}

// City coordinates for Philippine cities
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Manila": { lat: 14.6042, lng: 120.9822 },
  "Cebu City": { lat: 10.3167, lng: 123.8907 },
  "Davao": { lat: 7.0731, lng: 125.6128 },
  "Baguio": { lat: 16.4164, lng: 120.5931 },
  "Iloilo City": { lat: 10.75, lng: 122.55 },
  "Zamboanga City": { lat: 6.9214, lng: 122.0790 },
  "Cagayan de Oro": { lat: 8.4822, lng: 124.6472 },
  "Bacolod": { lat: 10.6767, lng: 122.9567 },
  "General Santos": { lat: 6.1128, lng: 125.1717 },
  "Tacloban City": { lat: 11.25, lng: 125.0 },
};

export default function WeatherMap({ forecasts, showRainfall, onToggleRainfall }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map
    const initMap = async () => {
      // Dynamically import Leaflet to avoid SSR issues
      const L = (window as any).L;
      if (!L) {
        // Load Leaflet if not already loaded
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initializeMap();
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      const L = (window as any).L;
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current).setView([12.8797, 121.7740], 6);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add city markers
      addCityMarkers(map, forecasts, showRainfall);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [forecasts, showRainfall]);

  const addCityMarkers = (map: any, forecasts: ForecastRecord[], showRainfall: boolean) => {
    const L = (window as any).L;
    if (!L) return;

    // Group forecasts by city and get latest forecast for each city
    const cityForecasts = new Map<string, ForecastRecord>();
    
    forecasts.forEach(forecast => {
      const existing = cityForecasts.get(forecast.cityName);
      if (!existing || new Date(forecast.date) > new Date(existing.date)) {
        cityForecasts.set(forecast.cityName, forecast);
      }
    });

    // Add markers for each city
    cityForecasts.forEach((forecast, cityName) => {
      const coords = CITY_COORDINATES[cityName];
      if (!coords) return;

      const value = showRainfall ? forecast.rainfall : forecast.temperature;
      const color = showRainfall 
        ? getRainfallColor(forecast.rainfall)
        : getTemperatureColor(forecast.temperature);

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-gray-900">${cityName}</h3>
          <p class="text-sm text-gray-600">Temperature: ${forecast.temperature.toFixed(1)}°C</p>
          <p class="text-sm text-gray-600">Rainfall: ${forecast.rainfall.toFixed(1)}mm</p>
          <p class="text-sm text-gray-600">Confidence: ${((forecast.confidence || 0) * 100).toFixed(0)}%</p>
        </div>
      `;

      marker.bindPopup(popupContent).addTo(map);
    });
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp > 35) return '#DC2626'; // Hot - Red
    if (temp > 30) return '#F59E0B'; // Warm - Orange
    if (temp > 25) return '#EAB308'; // Mild - Yellow
    if (temp > 20) return '#059669'; // Cool - Green
    return '#3B82F6'; // Cold - Blue
  };

  const getRainfallColor = (rainfall: number): string => {
    if (rainfall > 20) return '#1E40AF'; // Heavy - Dark Blue
    if (rainfall > 10) return '#3B82F6'; // Moderate - Blue
    if (rainfall > 5) return '#60A5FA'; // Light - Light Blue
    if (rainfall > 1) return '#93C5FD'; // Very Light - Very Light Blue
    return '#E5E7EB'; // None - Gray
  };

  return (
    <Card className="card-elevation">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Weather Map</h3>
        </div>
        
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200"
        />
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            {showRainfall ? 'Rainfall overlay active' : 'Temperature overlay active'}
          </span>
          <Button 
            variant="link" 
            size="sm" 
            onClick={onToggleRainfall}
            className="text-primary hover:text-blue-700 p-0"
          >
            Toggle {showRainfall ? 'Temperature' : 'Rainfall'}
          </Button>
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs font-medium text-gray-700 mb-2">
            {showRainfall ? 'Rainfall Legend (mm)' : 'Temperature Legend (°C)'}
          </p>
          <div className="flex flex-wrap gap-2">
            {showRainfall ? (
              <>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-gray-300 mr-1"></div>
                  <span className="text-xs">0-1</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-200 mr-1"></div>
                  <span className="text-xs">1-5</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-400 mr-1"></div>
                  <span className="text-xs">5-10</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-600 mr-1"></div>
                  <span className="text-xs">10-20</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-800 mr-1"></div>
                  <span className="text-xs">20+</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-xs">&lt;20</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs">20-25</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mr-1"></div>
                  <span className="text-xs">25-30</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-500 mr-1"></div>
                  <span className="text-xs">30-35</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-600 mr-1"></div>
                  <span className="text-xs">35+</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
