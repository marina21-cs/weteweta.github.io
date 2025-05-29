import { 
  WeatherData, 
  ForecastData, 
  ModelMetrics,
  InsertWeatherData, 
  InsertForecastData, 
  InsertModelMetrics,
  weatherData,
  forecastData,
  modelMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // Weather data operations
  insertWeatherData(data: InsertWeatherData[]): Promise<WeatherData[]>;
  getWeatherDataByCity(cityName: string): Promise<WeatherData[]>;
  getAllCities(): Promise<string[]>;
  getWeatherDataSummary(): Promise<{
    totalCities: number;
    totalDataPoints: number;
    dateRange: { start: Date; end: Date };
  }>;

  // Forecast operations
  insertForecastData(data: InsertForecastData[]): Promise<ForecastData[]>;
  getForecastsByCity(cityName: string): Promise<ForecastData[]>;
  getAllForecasts(): Promise<ForecastData[]>;
  getForecastsByDateRange(startDate: Date, endDate: Date): Promise<ForecastData[]>;

  // Model metrics
  insertModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics>;
  getLatestModelMetrics(): Promise<ModelMetrics | undefined>;
  getAllModelMetrics(): Promise<ModelMetrics[]>;
}

export class DatabaseStorage implements IStorage {
  async insertWeatherData(data: InsertWeatherData[]): Promise<WeatherData[]> {
    const processedData = data.map(item => ({
      ...item,
      windSpeed: item.windSpeed ?? null,
      humidity: item.humidity ?? null,
      pressure: item.pressure ?? null,
      visibility: item.visibility ?? null,
      cloudsAll: item.cloudsAll ?? null,
    }));
    
    return await db
      .insert(weatherData)
      .values(processedData)
      .returning();
  }

  async getWeatherDataByCity(cityName: string): Promise<WeatherData[]> {
    return await db
      .select()
      .from(weatherData)
      .where(eq(weatherData.cityName, cityName));
  }

  async getAllCities(): Promise<string[]> {
    const result = await db
      .selectDistinct({ cityName: weatherData.cityName })
      .from(weatherData);
    return result.map(row => row.cityName);
  }

  async getWeatherDataSummary(): Promise<{
    totalCities: number;
    totalDataPoints: number;
    dateRange: { start: Date; end: Date };
  }> {
    const cities = await this.getAllCities();
    const allData = await db.select().from(weatherData);
    
    const dates = allData.map(d => new Date(d.datetime)).sort();
    
    return {
      totalCities: cities.length,
      totalDataPoints: allData.length,
      dateRange: {
        start: dates[0] || new Date(),
        end: dates[dates.length - 1] || new Date()
      }
    };
  }

  async insertForecastData(data: InsertForecastData[]): Promise<ForecastData[]> {
    const processedData = data.map(item => ({
      ...item,
      confidence: item.confidence ?? null,
      modelVersion: item.modelVersion ?? null,
    }));
    
    return await db
      .insert(forecastData)
      .values(processedData)
      .returning();
  }

  async getForecastsByCity(cityName: string): Promise<ForecastData[]> {
    return await db
      .select()
      .from(forecastData)
      .where(eq(forecastData.cityName, cityName));
  }

  async getAllForecasts(): Promise<ForecastData[]> {
    return await db.select().from(forecastData);
  }

  async getForecastsByDateRange(startDate: Date, endDate: Date): Promise<ForecastData[]> {
    return await db
      .select()
      .from(forecastData)
      .where(and(
        gte(forecastData.date, startDate),
        lte(forecastData.date, endDate)
      ));
  }

  async insertModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics> {
    const processedMetrics = {
      ...metrics,
      accuracy: metrics.accuracy ?? null,
      loss: metrics.loss ?? null,
      valLoss: metrics.valLoss ?? null,
      citiesCount: metrics.citiesCount ?? null,
      dataPointsCount: metrics.dataPointsCount ?? null,
    };
    
    const [result] = await db
      .insert(modelMetrics)
      .values(processedMetrics)
      .returning();
    return result;
  }

  async getLatestModelMetrics(): Promise<ModelMetrics | undefined> {
    const [result] = await db
      .select()
      .from(modelMetrics)
      .orderBy(desc(modelMetrics.createdAt))
      .limit(1);
    return result;
  }

  async getAllModelMetrics(): Promise<ModelMetrics[]> {
    return await db
      .select()
      .from(modelMetrics)
      .orderBy(desc(modelMetrics.createdAt));
  }
}

export const storage = new DatabaseStorage();
