import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadWeatherDataFromCSV } from "@/lib/static-data";

interface UploadZoneProps {
  onUploadSuccess: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export default function UploadZone({ onUploadSuccess, isProcessing, setIsProcessing }: UploadZoneProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const loadSampleData = async () => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 150);

      const result = await loadWeatherDataFromCSV();

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Weather Data Loaded",
        description: `Processed ${result.summary.totalDataPoints} weather records from ${result.summary.totalCities} cities.`,
      });

      onUploadSuccess();
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load weather data.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="card-elevation">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Weather Data Processing</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Loading Section */}
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Philippine Weather Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Load comprehensive weather data from March 2025 covering multiple Philippine cities
                </p>
                <Button 
                  onClick={loadSampleData}
                  disabled={isProcessing}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  {isProcessing ? 'Loading Weather Data...' : 'Load Weather Data'}
                </Button>
              </div>
            </div>
          </div>

          {/* Processing Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">System Status</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                isProcessing 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isProcessing ? 'Processing' : 'Ready'}
              </span>
            </div>
            
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-600">Processing weather data in batches...</p>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">PostgreSQL database ready</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">LSTM model configured</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Forecast engine ready</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Data Overview</p>
                <p className="text-blue-700">14,000+ weather records</p>
                <p className="text-blue-700">Multiple Philippine cities</p>
                <p className="text-blue-700">Temperature, rainfall, and atmospheric data</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}