import { Card, CardContent } from "@/components/ui/card";
import { Building2, TrendingUp, Thermometer, CloudRain } from "lucide-react";

interface MetricsCardsProps {
  citiesCount: number;
  accuracy: number;
  avgTemperature: number;
  totalRainfall: number;
}

export default function MetricsCards({ 
  citiesCount, 
  accuracy, 
  avgTemperature, 
  totalRainfall 
}: MetricsCardsProps) {
  const metrics = [
    {
      title: "Cities Analyzed",
      value: citiesCount.toString(),
      icon: Building2,
      bgColor: "bg-primary",
    },
    {
      title: "Model Accuracy",
      value: `${accuracy.toFixed(1)}%`,
      icon: TrendingUp,
      bgColor: "bg-green-600",
    },
    {
      title: "Avg Temp Forecast",
      value: `${avgTemperature.toFixed(1)}°C`,
      icon: Thermometer,
      bgColor: "bg-orange-500",
    },
    {
      title: "Rainfall Predicted",
      value: `${totalRainfall.toFixed(0)}mm`,
      icon: CloudRain,
      bgColor: "bg-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card key={index} className={`${metric.bgColor} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <metric.icon className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
