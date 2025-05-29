import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableIcon, Search, Filter } from "lucide-react";
import { ForecastRecord } from "@/types/weather";

interface ForecastTableProps {
  forecasts: ForecastRecord[];
}

export default function ForecastTable({ forecasts }: ForecastTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter forecasts based on search term
  const filteredForecasts = forecasts.filter(forecast =>
    forecast.cityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort by date and city
  const sortedForecasts = [...filteredForecasts].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.cityName.localeCompare(b.cityName);
  });

  // Paginate results
  const totalPages = Math.ceil(sortedForecasts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedForecasts = sortedForecasts.slice(startIndex, startIndex + itemsPerPage);

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return <Badge variant="secondary">N/A</Badge>;
    
    const percentage = Math.round(confidence * 100);
    
    if (percentage >= 90) {
      return <Badge className="bg-green-100 text-green-800">High ({percentage}%)</Badge>;
    } else if (percentage >= 75) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium ({percentage}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Low ({percentage}%)</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="card-elevation">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TableIcon className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Detailed Forecast Data</h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10 w-60"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {paginatedForecasts.length === 0 ? (
          <div className="text-center py-12">
            <TableIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Forecast Data</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No results found for "${searchTerm}"`
                : "Upload weather data and generate forecasts to see detailed predictions."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-900">City</TableHead>
                    <TableHead className="font-medium text-gray-900">Date</TableHead>
                    <TableHead className="font-medium text-gray-900">Temperature (°C)</TableHead>
                    <TableHead className="font-medium text-gray-900">Rainfall (mm)</TableHead>
                    <TableHead className="font-medium text-gray-900">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedForecasts.map((forecast, index) => (
                    <TableRow key={`${forecast.cityName}-${forecast.date}-${index}`} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{forecast.cityName}</TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(forecast.date)}
                      </TableCell>
                      <TableCell className="font-mono text-red-600">
                        {forecast.temperature.toFixed(1)}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600">
                        {forecast.rainfall.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(forecast.confidence)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedForecasts.length)} of {sortedForecasts.length} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
