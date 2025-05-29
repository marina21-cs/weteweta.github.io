export interface WeatherRecord {
  id?: number;
  cityName: string;
  datetime: Date;
  temperature: number;
  rainfall: number;
  windSpeed?: number;
  humidity?: number;
  pressure?: number;
  visibility?: number;
  cloudsAll?: number;
}

export interface ForecastRecord {
  id?: number;
  cityName: string;
  date: Date;
  temperature: number;
  rainfall: number;
  confidence?: number;
  modelVersion?: string;
}

export interface ModelMetrics {
  id?: number;
  modelId: string;
  accuracy?: number;
  loss?: number;
  valLoss?: number;
  trainingHistory?: {
    epochs: number[];
    trainLoss: number[];
    valLoss: number[];
  };
  citiesCount?: number;
  dataPointsCount?: number;
  createdAt?: Date;
}

export interface CityCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export interface ProcessingStatus {
  step: string;
  completed: boolean;
  message: string;
}

export interface WeatherSummary {
  totalCities: number;
  totalDataPoints: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}
