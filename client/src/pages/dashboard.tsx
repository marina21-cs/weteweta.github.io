import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import UploadZone from "@/components/upload-zone";
import MetricsCards from "@/components/metrics-cards";
import WeatherCharts from "@/components/weather-charts";
import WeatherMap from "@/components/weather-map";
import CityRankings from "@/components/city-rankings";
import ExportControls from "@/components/export-controls";
import ForecastTable from "@/components/forecast-table";

import { ForecastRecord, ModelMetrics, WeatherSummary } from "@/types/weather";

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCity, setSelectedCity] = useState("all");
  const [showRainfall, setShowRainfall] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch weather data summary
  const { data: summary } = useQuery<WeatherSummary>({
    queryKey: ["/api/weather-data/summary"],
    retry: false,
  });

  // Fetch cities
  const { data: cities = [] } = useQuery<string[]>({
    queryKey: ["/api/cities"],
    retry: false,
  });

  // Fetch forecasts
  const { data: forecasts = [] } = useQuery<ForecastRecord[]>({
    queryKey: ["/api/forecasts"],
    retry: false,
  });

  // Fetch model metrics
  const { data: modelMetrics } = useQuery<ModelMetrics>({
    queryKey: ["/api/model-metrics"],
    enabled: forecasts.length > 0,
    retry: false,
  });

  // Generate forecast mutation
  const generateForecastMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/generate-forecast'),
    onSuccess: () => {
      toast({
        title: "Forecast Generated",
        description: "Weather forecast for April 2025 has been successfully generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/model-metrics"] });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate weather forecast.",
        variant: "destructive",
      });
    },
  });

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/weather-data/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/cities"] });
    
    // Auto-generate forecast after successful upload
    if (cities.length > 0) {
      generateForecastMutation.mutate();
    }
  };

  const handleExportResults = async () => {
    try {
      const response = await apiRequest('GET', '/api/export/forecasts');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'weather_forecast_results.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Forecast results have been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export forecast results.",
        variant: "destructive",
      });
    }
  };

  // Calculate metrics for display
  const metricsData = (() => {
    if (!forecasts.length || !modelMetrics) {
      return {
        citiesCount: cities.length,
        accuracy: 0,
        avgTemperature: 0,
        totalRainfall: 0,
      };
    }

    const avgTemperature = forecasts.reduce((sum, f) => sum + f.temperature, 0) / forecasts.length;
    const totalRainfall = forecasts.reduce((sum, f) => sum + f.rainfall, 0);

    return {
      citiesCount: cities.length,
      accuracy: modelMetrics.accuracy || 0,
      avgTemperature,
      totalRainfall,
    };
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Cloud className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-medium text-gray-900">Weather Forecast Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">LSTM Prediction System</span>
              <Button 
                onClick={handleExportResults}
                className="bg-primary hover:bg-blue-700 text-white"
                disabled={forecasts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Upload Section */}
        <div className="mb-8">
          <UploadZone 
            onUploadSuccess={handleUploadSuccess}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </div>

        {/* Generate Forecast Button */}
        {cities.length > 0 && forecasts.length === 0 && (
          <div className="mb-8 text-center">
            <Button 
              onClick={() => generateForecastMutation.mutate()}
              disabled={generateForecastMutation.isPending}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {generateForecastMutation.isPending ? "Generating..." : "Generate Forecast"}
            </Button>
          </div>
        )}

        {/* Key Metrics */}
        <MetricsCards {...metricsData} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <WeatherCharts
            forecasts={forecasts}
            modelMetrics={modelMetrics || null}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            cities={cities}
          />

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Map Visualization */}
            <WeatherMap
              forecasts={forecasts}
              showRainfall={showRainfall}
              onToggleRainfall={() => setShowRainfall(!showRainfall)}
            />

            {/* City Rankings */}
            <CityRankings
              forecasts={forecasts}
              mode="temperature"
            />

            {/* Export Options */}
            <ExportControls />
          </div>
        </div>

        {/* Detailed Forecast Table */}
        <div className="mt-8">
          <ForecastTable forecasts={forecasts} />
        </div>
      </div>
    </div>
  );
}
