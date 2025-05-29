import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { ForecastRecord } from "@/types/weather";

interface CityRankingsProps {
  forecasts: ForecastRecord[];
  mode: "temperature" | "rainfall";
}

export default function CityRankings({ forecasts, mode }: CityRankingsProps) {
  // Calculate average values per city
  const cityStats = forecasts.reduce((acc, forecast) => {
    if (!acc[forecast.cityName]) {
      acc[forecast.cityName] = {
        totalTemp: 0,
        totalRain: 0,
        count: 0,
      };
    }
    
    acc[forecast.cityName].totalTemp += forecast.temperature;
    acc[forecast.cityName].totalRain += forecast.rainfall;
    acc[forecast.cityName].count += 1;
    
    return acc;
  }, {} as Record<string, { totalTemp: number; totalRain: number; count: number }>);

  // Calculate averages and sort
  const rankings = Object.entries(cityStats)
    .map(([city, stats]) => ({
      city,
      avgTemp: stats.totalTemp / stats.count,
      avgRain: stats.totalRain / stats.count,
    }))
    .sort((a, b) => {
      if (mode === "temperature") {
        return b.avgTemp - a.avgTemp;
      } else {
        return b.avgRain - a.avgRain;
      }
    })
    .slice(0, 5);

  const getRankColor = (index: number): string => {
    const colors = [
      "bg-red-500",
      "bg-orange-500", 
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500"
    ];
    return colors[index] || "bg-gray-500";
  };

  const getRankBgColor = (index: number): string => {
    const colors = [
      "bg-red-50",
      "bg-orange-50",
      "bg-yellow-50", 
      "bg-blue-50",
      "bg-green-50"
    ];
    return colors[index] || "bg-gray-50";
  };

  const getRankTextColor = (index: number): string => {
    const colors = [
      "text-red-600",
      "text-orange-600",
      "text-yellow-600",
      "text-blue-600", 
      "text-green-600"
    ];
    return colors[index] || "text-gray-600";
  };

  const formatValue = (city: { avgTemp: number; avgRain: number }): string => {
    if (mode === "temperature") {
      return `${city.avgTemp.toFixed(1)}°C`;
    } else {
      return `${city.avgRain.toFixed(1)}mm`;
    }
  };

  return (
    <Card className="card-elevation">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Trophy className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Top Cities by {mode === "temperature" ? "Temperature" : "Rainfall"}
          </h3>
        </div>
        
        <div className="space-y-3">
          {rankings.map((city, index) => (
            <div 
              key={city.city}
              className={`flex items-center justify-between p-3 rounded-md ${getRankBgColor(index)}`}
            >
              <div className="flex items-center">
                <span 
                  className={`w-6 h-6 ${getRankColor(index)} text-white rounded-full flex items-center justify-center text-xs font-bold mr-3`}
                >
                  {index + 1}
                </span>
                <span className="font-medium text-gray-900">{city.city}</span>
              </div>
              <span className={`font-mono font-semibold ${getRankTextColor(index)}`}>
                {formatValue(city)}
              </span>
            </div>
          ))}
        </div>

        {rankings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No forecast data available</p>
            <p className="text-sm">Upload weather data to see city rankings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
