import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Thermometer, CloudRain, Download } from "lucide-react";
import { ForecastRecord, ModelMetrics } from "@/types/weather";
import Chart from "chart.js/auto";

interface WeatherChartsProps {
  forecasts: ForecastRecord[];
  modelMetrics: ModelMetrics | null;
  selectedCity: string;
  onCityChange: (city: string) => void;
  cities: string[];
}

export default function WeatherCharts({ 
  forecasts, 
  modelMetrics, 
  selectedCity, 
  onCityChange, 
  cities 
}: WeatherChartsProps) {
  const trainingChartRef = useRef<HTMLCanvasElement>(null);
  const temperatureChartRef = useRef<HTMLCanvasElement>(null);
  const rainfallChartRef = useRef<HTMLCanvasElement>(null);
  
  const trainingChartInstance = useRef<Chart | null>(null);
  const temperatureChartInstance = useRef<Chart | null>(null);
  const rainfallChartInstance = useRef<Chart | null>(null);

  // Filter forecasts by selected city
  const filteredForecasts = selectedCity === "all" 
    ? forecasts 
    : forecasts.filter(f => f.cityName === selectedCity);

  // Prepare temperature data
  const temperatureData = prepareTemperatureData(filteredForecasts, selectedCity);
  
  // Prepare rainfall data
  const rainfallData = prepareRainfallData(filteredForecasts, selectedCity);

  useEffect(() => {
    if (trainingChartRef.current && modelMetrics?.trainingHistory) {
      if (trainingChartInstance.current) {
        trainingChartInstance.current.destroy();
      }

      trainingChartInstance.current = new Chart(trainingChartRef.current, {
        type: 'line',
        data: {
          labels: modelMetrics.trainingHistory.epochs.map(e => `Epoch ${e}`),
          datasets: [
            {
              label: 'Training Loss',
              data: modelMetrics.trainingHistory.trainLoss,
              borderColor: '#1976D2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Validation Loss',
              data: modelMetrics.trainingHistory.valLoss,
              borderColor: '#F57C00',
              backgroundColor: 'rgba(245, 124, 0, 0.1)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'MSE Loss',
              },
            },
          },
        },
      });
    }

    return () => {
      if (trainingChartInstance.current) {
        trainingChartInstance.current.destroy();
      }
    };
  }, [modelMetrics]);

  useEffect(() => {
    if (temperatureChartRef.current && temperatureData.labels.length > 0) {
      if (temperatureChartInstance.current) {
        temperatureChartInstance.current.destroy();
      }

      temperatureChartInstance.current = new Chart(temperatureChartRef.current, {
        type: 'line',
        data: temperatureData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'Temperature (°C)',
              },
            },
          },
        },
      });
    }

    return () => {
      if (temperatureChartInstance.current) {
        temperatureChartInstance.current.destroy();
      }
    };
  }, [temperatureData]);

  useEffect(() => {
    if (rainfallChartRef.current && rainfallData.labels.length > 0) {
      if (rainfallChartInstance.current) {
        rainfallChartInstance.current.destroy();
      }

      rainfallChartInstance.current = new Chart(rainfallChartRef.current, {
        type: 'bar',
        data: rainfallData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Rainfall (mm)',
              },
            },
          },
        },
      });
    }

    return () => {
      if (rainfallChartInstance.current) {
        rainfallChartInstance.current.destroy();
      }
    };
  }, [rainfallData]);

  const downloadChart = (chartRef: React.RefObject<HTMLCanvasElement>, filename: string) => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = chartRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Training History */}
      <Card className="card-elevation">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Model Training History</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadChart(trainingChartRef, 'training_history.png')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="h-[300px]">
            <canvas ref={trainingChartRef}></canvas>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Forecast */}
      <Card className="card-elevation">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Thermometer className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Temperature Forecast - April 2025</h3>
            </div>
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-[300px]">
            <canvas ref={temperatureChartRef}></canvas>
          </div>
        </CardContent>
      </Card>

      {/* Rainfall Forecast */}
      <Card className="card-elevation">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CloudRain className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Rainfall Forecast - April 2025</h3>
            </div>
            <div className="flex space-x-2">
              <Button variant="default" size="sm" className="bg-primary text-white">
                Daily
              </Button>
              <Button variant="outline" size="sm">
                Weekly
              </Button>
            </div>
          </div>
          <div className="h-[300px]">
            <canvas ref={rainfallChartRef}></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function prepareTemperatureData(forecasts: ForecastRecord[], selectedCity: string) {
  if (forecasts.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Sort forecasts by date
  const sortedForecasts = [...forecasts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get unique dates
  const dates = [...new Set(sortedForecasts.map(f => 
    new Date(f.date).toLocaleDateString()
  ))];

  if (selectedCity === "all") {
    // Group by city
    const cities = [...new Set(sortedForecasts.map(f => f.cityName))];
    const colors = [
      '#DC2626', '#F59E0B', '#059669', '#7C3AED', '#DB2777'
    ];

    const datasets = cities.slice(0, 5).map((city, index) => {
      const cityForecasts = sortedForecasts.filter(f => f.cityName === city);
      const data = dates.map(date => {
        const forecast = cityForecasts.find(f => 
          new Date(f.date).toLocaleDateString() === date
        );
        return forecast?.temperature || null;
      });

      return {
        label: city,
        data,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        tension: 0.4,
      };
    });

    return { labels: dates, datasets };
  } else {
    // Single city
    const cityForecasts = sortedForecasts.filter(f => f.cityName === selectedCity);
    const data = dates.map(date => {
      const forecast = cityForecasts.find(f => 
        new Date(f.date).toLocaleDateString() === date
      );
      return forecast?.temperature || null;
    });

    return {
      labels: dates,
      datasets: [{
        label: selectedCity,
        data,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
      }],
    };
  }
}

function prepareRainfallData(forecasts: ForecastRecord[], selectedCity: string) {
  if (forecasts.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Sort forecasts by date
  const sortedForecasts = [...forecasts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get unique dates
  const dates = [...new Set(sortedForecasts.map(f => 
    new Date(f.date).toLocaleDateString()
  ))];

  if (selectedCity === "all") {
    // Average rainfall across all cities
    const data = dates.map(date => {
      const dayForecasts = sortedForecasts.filter(f => 
        new Date(f.date).toLocaleDateString() === date
      );
      const avgRainfall = dayForecasts.reduce((sum, f) => sum + f.rainfall, 0) / dayForecasts.length;
      return avgRainfall || 0;
    });

    return {
      labels: dates,
      datasets: [{
        label: 'Average Rainfall',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      }],
    };
  } else {
    // Single city
    const cityForecasts = sortedForecasts.filter(f => f.cityName === selectedCity);
    const data = dates.map(date => {
      const forecast = cityForecasts.find(f => 
        new Date(f.date).toLocaleDateString() === date
      );
      return forecast?.rainfall || 0;
    });

    return {
      labels: dates,
      datasets: [{
        label: selectedCity,
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      }],
    };
  }
}
