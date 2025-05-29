import { pgTable, text, serial, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  cityName: text("city_name").notNull(),
  datetime: timestamp("datetime").notNull(),
  temperature: real("temperature").notNull(),
  rainfall: real("rainfall").notNull(),
  windSpeed: real("wind_speed"),
  humidity: real("humidity"),
  pressure: real("pressure"),
  visibility: real("visibility"),
  cloudsAll: real("clouds_all"),
});

export const forecastData = pgTable("forecast_data", {
  id: serial("id").primaryKey(),
  cityName: text("city_name").notNull(),
  date: timestamp("date").notNull(),
  temperature: real("temperature").notNull(),
  rainfall: real("rainfall").notNull(),
  confidence: real("confidence"),
  modelVersion: text("model_version"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modelMetrics = pgTable("model_metrics", {
  id: serial("id").primaryKey(),
  modelId: text("model_id").notNull(),
  accuracy: real("accuracy"),
  loss: real("loss"),
  valLoss: real("val_loss"),
  trainingHistory: jsonb("training_history"),
  citiesCount: integer("cities_count"),
  dataPointsCount: integer("data_points_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWeatherDataSchema = createInsertSchema(weatherData);
export const insertForecastDataSchema = createInsertSchema(forecastData);
export const insertModelMetricsSchema = createInsertSchema(modelMetrics);

export type WeatherData = typeof weatherData.$inferSelect;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type ForecastData = typeof forecastData.$inferSelect;
export type InsertForecastData = z.infer<typeof insertForecastDataSchema>;
export type ModelMetrics = typeof modelMetrics.$inferSelect;
export type InsertModelMetrics = z.infer<typeof insertModelMetricsSchema>;
