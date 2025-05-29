import Papa from "papaparse";
import { WeatherRecord } from "@/types/weather";

export interface CSVProcessingResult {
  data: WeatherRecord[];
  errors: string[];
  summary: {
    totalRows: number;
    validRows: number;
    cities: string[];
  };
}

export function parseWeatherCSV(csvContent: string): CSVProcessingResult {
  const result: CSVProcessingResult = {
    data: [],
    errors: [],
    summary: {
      totalRows: 0,
      validRows: 0,
      cities: [],
    },
  };

  try {
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/"/g, ""),
    });

    result.summary.totalRows = parsed.data.length;
    const citiesSet = new Set<string>();

    parsed.data.forEach((row: any, index: number) => {
      try {
        const cityName = row["city_name"]?.trim();
        const datetime = row["datetime"]?.trim();
        const temp = row["main.temp"];
        const rain = row["rain.1h"] || "0";

        if (!cityName || !datetime || !temp) {
          result.errors.push(`Row ${index + 1}: Missing required fields`);
          return;
        }

        const weatherRecord: WeatherRecord = {
          cityName,
          datetime: new Date(datetime),
          temperature: parseFloat(temp),
          rainfall: parseFloat(rain) || 0,
          windSpeed: parseFloat(row["wind.speed"]) || undefined,
          humidity: parseFloat(row["main.humidity"]) || undefined,
          pressure: parseFloat(row["main.pressure"]) || undefined,
          visibility: parseFloat(row["visibility"]) || undefined,
          cloudsAll: parseFloat(row["clouds.all"]) || undefined,
        };

        if (isNaN(weatherRecord.temperature)) {
          result.errors.push(`Row ${index + 1}: Invalid temperature value`);
          return;
        }

        if (isNaN(weatherRecord.datetime.getTime())) {
          result.errors.push(`Row ${index + 1}: Invalid datetime format`);
          return;
        }

        result.data.push(weatherRecord);
        citiesSet.add(cityName);
        result.summary.validRows++;
      } catch (error) {
        result.errors.push(`Row ${index + 1}: ${error}`);
      }
    });

    result.summary.cities = Array.from(citiesSet);

    if (parsed.errors.length > 0) {
      parsed.errors.forEach((error) => {
        result.errors.push(`Parse error: ${error.message}`);
      });
    }
  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error}`);
  }

  return result;
}

export function validateWeatherData(data: WeatherRecord[]): string[] {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push("No valid weather data found");
    return errors;
  }

  const cities = new Set(data.map((d) => d.cityName));
  if (cities.size < 2) {
    errors.push("At least 2 cities required for meaningful analysis");
  }

  const dateRange = data.reduce(
    (range, record) => {
      const date = new Date(record.datetime);
      return {
        min: date < range.min ? date : range.min,
        max: date > range.max ? date : range.max,
      };
    },
    { min: new Date(), max: new Date(0) }
  );

  const daysDiff = Math.abs(dateRange.max.getTime() - dateRange.min.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff < 7) {
    errors.push("At least 7 days of data required for forecast generation");
  }

  return errors;
}
