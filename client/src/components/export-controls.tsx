import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ExportControls() {
  const { toast } = useToast();

  const exportForecastCSV = async () => {
    try {
      const response = await apiRequest('GET', '/api/export/forecasts');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'weather_forecast.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Forecast data has been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export forecast data.",
        variant: "destructive",
      });
    }
  };

  const exportPDFReport = () => {
    toast({
      title: "Feature Coming Soon",
      description: "PDF report export will be available in the next update.",
    });
  };

  const exportChartsPNG = () => {
    toast({
      title: "Charts Export",
      description: "Use the download buttons on individual charts to export them as PNG.",
    });
  };

  return (
    <Card className="card-elevation">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Download className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={exportForecastCSV}
            className="w-full flex items-center justify-center bg-primary hover:bg-blue-700 text-white"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Forecast CSV
          </Button>
          
          <Button 
            onClick={exportPDFReport}
            className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          
          <Button 
            onClick={exportChartsPNG}
            className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Image className="h-4 w-4 mr-2" />
            Charts PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
