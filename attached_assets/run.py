import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
from matplotlib.backends.backend_pdf import PdfPages

# Step 1: Preprocess Data
def data_preprocessing(data):
    data = data.copy()
    data['rain.1h'] = data['rain.1h'].fillna(0)
    data['wind.gust'] = data['wind.gust'].fillna(data['wind.gust'].median())
    data['visibility'] = data['visibility'].fillna(data['visibility'].median())
    
    columns_to_drop = ['sys.sunrise', 'sys.sunset', 'weather.description']
    data = data.drop(columns=[col for col in columns_to_drop if col in data.columns])
    
    data['datetime'] = pd.to_datetime(data['datetime'])
    data['hour'] = data['datetime'].dt.hour
    data['day'] = data['datetime'].dt.day
    data['month'] = data['datetime'].dt.month
    data['day_of_year'] = data['datetime'].dt.dayofyear
    return data

try:
    data = pd.read_csv("202503_CombinedData.csv")
    data = data_preprocessing(data)
except Exception as e:
    print(f"Error loading or preprocessing data: {e}")
    raise

# Step 2: Prepare Time-Series Data
daily_data = data.groupby(['city_name', data['datetime'].dt.date]).agg({
    'main.temp': 'mean', 
    'rain.1h': 'sum', 
    'wind.speed': 'mean', 
    'clouds.all': 'mean', 
    'visibility': 'mean'
}).reset_index()
daily_data['datetime'] = pd.to_datetime(daily_data['datetime'])

print("Days per city in daily_data:")
print(daily_data.groupby('city_name')['datetime'].nunique())

# Initialize scalers
scaler_features = MinMaxScaler()
scaler_targets = MinMaxScaler()

features = ['main.temp', 'rain.1h', 'wind.speed', 'clouds.all', 'visibility']
target_cols = ['main.temp', 'rain.1h']
seq_length = 5

def create_sequences(df, target_cols, seq_length=5, features=None):
    if features is None:
        features = []
    X, y = [], []
    
    feature_data = df[features].values
    target_data = df[target_cols].values
    scaler_features.fit(feature_data)
    scaler_targets.fit(target_data)
    
    for city in df['city_name'].unique():
        city_data = df[df['city_name'] == city].sort_values('datetime')
        print(f"Processing {city} with {len(city_data)} days of data")
        
        if not all(feature in city_data.columns for feature in features):
            print(f"Missing features for {city}, skipping")
            continue
            
        if len(city_data) <= seq_length:
            print(f"Skipping {city}: insufficient data ({len(city_data)} days)")
            continue
            
        data_array = scaler_features.transform(city_data[features].values)
        target_array = scaler_targets.transform(city_data[target_cols].values)
        
        for i in range(len(city_data) - seq_length):
            X.append(data_array[i:i + seq_length])
            y.append(target_array[i + seq_length])
    
    if not X or not y:
        raise ValueError("No sequences created. Check your data and feature lists.")
        
    X = np.array(X)
    y = np.array(y)
    print("X shape:", X.shape)
    print("y shape:", y.shape)
    return X, y

missing_features = [feat for feat in features if feat not in daily_data.columns]
if missing_features:
    raise ValueError(f"Features {missing_features} not found in dataframe")

X, y = create_sequences(daily_data, target_cols, seq_length, features)

train_size = int(len(X) * 0.8)
X_train, X_val = X[:train_size], X[train_size:]
y_train, y_val = y[:train_size], y[train_size:]
print("X_train shape:", X_train.shape)
print("y_train shape:", y_train.shape)

# Step 3: Build and Train LSTM Model
model = Sequential()
model.add(LSTM(50, activation='relu', input_shape=(seq_length, len(features)), return_sequences=True))
model.add(Dropout(0.2))
model.add(LSTM(50, activation='relu'))
model.add(Dropout(0.2))
model.add(Dense(len(target_cols)))
model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')

early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

history = model.fit(
    X_train, y_train, 
    epochs=50, 
    batch_size=32, 
    validation_data=(X_val, y_val), 
    verbose=1,
    callbacks=[early_stopping]
)

plt.figure(figsize=(10, 6))
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss (MSE)')
plt.title('LSTM Training History')
plt.legend()
plt.savefig('training_history.png')
plt.close()
print("Training history saved as 'training_history.png'")

# Step 4: Forecast April 2025
def predict_next_day(model, last_sequence, seq_length, n_features):
    if last_sequence.shape != (seq_length, n_features):
        raise ValueError(f"Expected sequence shape ({seq_length}, {n_features}), got {last_sequence.shape}")
    model_input = last_sequence.reshape((1, seq_length, n_features))
    scaled_prediction = model.predict(model_input, verbose=0)[0]
    dummy = np.zeros((1, len(target_cols)))
    dummy[0] = scaled_prediction
    prediction = scaler_targets.inverse_transform(dummy)[0]
    temp = max(0, min(50, prediction[0]))  # Temperature between 0–50°C
    rain = max(0, prediction[1])  # Rainfall non-negative
    return [temp, rain]

cities_with_complete_data = [city for city in daily_data['city_name'].unique() 
                           if len(daily_data[daily_data['city_name'] == city]) >= seq_length]

if not cities_with_complete_data:
    raise ValueError("No cities with enough data found for forecasting")

last_date = daily_data['datetime'].max()
start_date = last_date - pd.Timedelta(days=seq_length-1)
last_7_days = daily_data[(daily_data['datetime'] >= start_date) & 
                         (daily_data['city_name'].isin(cities_with_complete_data))].copy()

forecast = {city: {'temp': [], 'rain': []} for city in cities_with_complete_data}
dates = pd.date_range(start='2025-04-01', end='2025-04-30', freq='D')

for city in forecast.keys():
    city_data = last_7_days[last_7_days['city_name'] == city].sort_values('datetime').tail(seq_length)
    if len(city_data) < seq_length:
        print(f"Skipping {city}: insufficient recent data ({len(city_data)} days)")
        continue
        
    current_sequence = scaler_features.transform(city_data[features].values)
    
    for date in dates:
        try:
            prediction = predict_next_day(model, current_sequence, seq_length, len(features))
            temp, rain = prediction[0], prediction[1]
            forecast[city]['temp'].append(temp)
            forecast[city]['rain'].append(rain)
            new_row = scaler_features.transform(np.array([[temp, rain, 
                                                          city_data['wind.speed'].mean(),
                                                          city_data['clouds.all'].mean(),
                                                          city_data['visibility'].mean()]]))
            current_sequence = np.vstack([current_sequence[1:], new_row])
        except Exception as e:
            print(f"Error predicting for {city} on {date}: {e}")
            continue

forecast_data = []
for date in dates:
    date_idx = dates.get_loc(date)
    for city in forecast:
        if date_idx < len(forecast[city]['temp']):
            forecast_data.append({
                'date': date,
                'city': city,
                'temp': forecast[city]['temp'][date_idx],
                'rain': forecast[city]['rain'][date_idx]
            })

forecast_df = pd.DataFrame(forecast_data)
print("Forecast DataFrame sample:")
print(forecast_df.head())

# Step 5: Add Coordinates and Calculate Averages
city_coords = {
    "Alaminos": (16.1561, 119.9811),
    "Angeles City": (15.15, 120.5833),
    "Antipolo": (15.6181, 121.19),
    "Bacolod": (12.2285, 123.5085),
    "Bacoor": (14.459, 120.929),
    "Bago City": (10.5333, 122.8333),
    "Baguio": (16.4164, 120.5931),
    "Bais": (9.5911, 123.1228),
    "Balanga": (14.6761, 120.5361),
    "Batac City": (18.0554, 120.5649),
    "Batangas City": (13.75, 121.05),
    "Bayawan": (9.3636, 122.8011),
    "Baybay": (13.4083, 123.7135),
    "Bayugan": (8.7561, 125.7675),
    "Bislig": (11.0725, 125.0336),
    "Biñan": (14.3427, 121.0807),
    "Bogo": (11.0517, 124.0055),
    "Borongan": (11.6081, 125.4319),
    "Butuan": (8.9492, 125.5436),
    "Cabadbaran": (9.1236, 125.5344),
    "Cabanatuan City": (15.4833, 120.9667),
    "Cabuyao": (14.2726, 121.1262),
    "Cadiz": (10.9506, 123.2856),
    "Cagayan de Oro": (8.4822, 124.6472),
    "Calaca": (13.9324, 120.8133),
    "Calamba": (14.2117, 121.1653),
    "Calapan": (13.4117, 121.1803),
    "Calbayog City": (12.0667, 124.6),
    "Caloocan City": (14.65, 120.9667),
    "Candon": (17.1947, 120.4517),
    "Canlaon": (10.3864, 123.1964),
    "Carcar": (10.1061, 123.6402),
    "Carmona": (14.3132, 121.0576),
    "Catbalogan": (11.7753, 124.8861),
    "Cauayan": (16.9347, 121.7725),
    "Cavite City": (14.4825, 120.9169),
    "Cebu City": (10.3167, 123.8907),
    "City of Marikina": (14.6333, 121.1),
    "City of Masbate": (12.3333, 123.5833),
    "City of Passi": (11.15, 122.65),
    "City of Sorsogon": (12.9833, 123.9833),
    "Cotabato": (7.2236, 124.2464),
    "Dagupan": (17.7061, 121.5047),
    "Danao": (10.5208, 124.0272),
    "Dapitan": (10.2706, 123.9469),
    "Dasmariñas": (14.3294, 120.9367),
    "Davao": (7.0731, 125.6128),
    "Digos": (6.7497, 125.3572),
    "Dipolog": (8.5894, 123.3414),
    "Dumaguete": (9.3103, 123.3081),
    "El Salvador": (8.5631, 124.5225),
    "Escalante": (10.8403, 123.4992),
    "Gapan": (15.3072, 120.9464),
    "General Santos": (6.1128, 125.1717),
    "General Trias": (14.3869, 120.8817),
    "Gingoog City": (8.8333, 125.1167),
    "Himamaylan": (10.0989, 122.8706),
    "Ilagan": (17.1485, 121.8892),
    "Iligan City": (8.25, 124.4),
    "Iloilo City": (10.75, 122.55),
    "Imus": (14.4297, 120.9367),
    "Iriga City": (13.4167, 123.4167),
    "Isabela": (10.2048, 122.9888),
    "Kabankalan": (9.9889, 122.8122),
    "Kidapawan": (7.0083, 125.0894),
    "Koronadal": (6.5031, 124.8469),
    "La Carlota": (10.4233, 122.9208),
    "Lamitan": (6.0872, 125.7022),
    "Laoag": (18.1989, 120.5936),
    "Lapu-Lapu City": (10.3103, 123.9494),
    "Las Piñas": (14.4506, 120.9828),
    "Legazpi City": (13.1333, 123.7333),
    "Ligao": (13.2403, 123.5325),
    "Lipa City": (13.95, 121.1667),
    "Lucena": (10.8794, 122.5967),
    "Maasin": (10.8925, 122.4347),
    "Mabalacat City": (15.2216, 120.5736),
    "Makati City": (14.5503, 121.0327),
    "Malabon": (15.6361, 119.9379),
    "Malaybalay": (8.15, 125.0833),
    "Malolos": (14.8419, 120.8117),
    "Mandaluyong City": (14.5832, 121.0409),
    "Mandaue City": (10.3333, 123.9333),
    "Manila": (14.6042, 120.9822),
    "Marawi": (7.9986, 124.2928),
    "Mati": (9.7339, 125.4708),
    "Meycauayan": (14.7369, 120.9608),
    "Muñoz": (15.7161, 120.9031),
    "Naga": (13.6192, 123.1814),
    "Navotas": (14.6667, 120.95),
    "Olongapo": (14.8292, 120.2828),
    "Ormoc": (11.0064, 124.6075),
    "Oroquieta": (8.4858, 123.8044),
    "Ozamiz City": (8.15, 123.8333),
    "Pagadian": (7.8257, 123.437),
    "Palayan City": (15.55, 121.0833),
    "Panabo": (7.3081, 125.6842),
    "Paranaque City": (14.4816, 121.0175),
    "Pasig": (14.587, 121.065),
    "Puerto Princesa City": (9.7333, 118.7333),
    "Quezon City": (14.6333, 121.0333),
    "Roxas": (17.1189, 121.6201),
    "Sagay": (10.9447, 123.4242),
    "Samal": (14.7678, 120.5431),
    "San Carlos": (15.5448, 120.8931),
    "San Fernando": (16.6159, 120.3166),
    "San Jose": (17.8927, 121.8712),
    "San Jose del Monte": (14.8139, 121.0453),
    "San Juan": (17.7422, 120.4583),
    "San Pablo": (14.9696, 120.6197),
    "San Pedro": (17.2, 121.8833),
    "Santa Rosa": (15.4238, 120.9378),
    "Santiago": (17.2939, 120.4449),
    "Santo Tomas": (17.3997, 121.7645),
    "Silay City": (10.8, 122.9667),
    "Sipalay": (9.7519, 122.4042),
    "Surigao City": (9.75, 125.5),
    "Tabaco": (13.3586, 123.7336),
    "Tabuk": (17.4189, 121.4443),
    "Tacloban City": (11.25, 125.0),
    "Tacurong": (6.6925, 124.6764),
    "Tagaytay City": (14.1059, 120.9337),
    "Taguig": (14.5243, 121.0792),
    "Talisay": (14.1343, 122.9226),
    "Tanauan": (14.0863, 121.1498),
    "Tandag": (9.0783, 126.1986),
    "Tangub": (10.6339, 122.9306),
    "Tanjay": (9.5153, 123.1583),
    "Tarlac City": (15.4889, 120.5986),
    "Tayabas": (14.0289, 121.5911),
    "Toledo City": (10.3833, 123.6333),
    "Tuguegarao": (17.6131, 121.7269),
    "Urdaneta": (15.9761, 120.5711),
    "Valencia": (11.1089, 124.5725),
    "Valenzuela": (14.7, 120.9667),
    "Victorias": (10.9, 123.0778),
    "Vigan": (17.5747, 120.3869),
    "Zamboanga City": (6.9135, 122.0696)
}

missing_coords = [city for city in forecast.keys() if city not in city_coords]
if missing_coords:
    print(f"Warning: Missing coordinates for cities: {missing_coords}")
    for city in missing_coords:
        city_coords[city] = (0, 0)

avg_forecast = {}
for city in forecast.keys():
    if city in city_coords and len(forecast[city]['temp']) > 0:
        avg_forecast[city] = {
            'avg_temp': sum(forecast[city]['temp']) / len(forecast[city]['temp']),
            'avg_rain': sum(forecast[city]['rain']) / len(forecast[city]['rain']),
            'lat': city_coords[city][0],
            'lon': city_coords[city][1]
        }

avg_forecast_df = pd.DataFrame(avg_forecast).T.reset_index().rename(columns={'index': 'city_name'})

# Step 6: Generate Contour Heatmaps
if len(avg_forecast) < 3:
    print("Not enough cities with coordinates to generate heatmaps. Need at least 3.")
else:
    lats = avg_forecast_df['lat']
    lons = avg_forecast_df['lon']
    temps = avg_forecast_df['avg_temp']
    lat_grid, lon_grid = np.meshgrid(
        np.linspace(min(lats), max(lats), 100),
        np.linspace(min(lons), max(lons), 100)
    )
    
    try:
        temp_grid = griddata((lats, lons), temps, (lat_grid, lon_grid), method='linear')
        plt.figure(figsize=(12, 8))
        contour = plt.tricontourf(lons, lats, temps, levels=20, cmap='RdYlBu_r')
        plt.colorbar(contour, label='Average Temperature (°C)')
        plt.scatter(lons, lats, c='black', marker='o', s=50, label='Cities')
        for city, (lon, lat) in zip(avg_forecast_df['city_name'], zip(lons, lats)):
            plt.text(lon, lat, city, fontsize=8, ha='center', va='bottom')
        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.title('April 2025 Average Temperature Contour Map (LSTM)')
        plt.legend()
        plt.savefig('temp_map.png', dpi=300)
        plt.close()
        print("Temperature map saved as 'temp_map.png'")
        
        rains = avg_forecast_df['avg_rain']
        rain_grid = griddata((lats, lons), rains, (lat_grid, lon_grid), method='linear')
        plt.figure(figsize=(12, 8))
        contour = plt.tricontourf(lons, lats, rains, levels=20, cmap='Blues')
        plt.colorbar(contour, label='Average Rainfall (mm)')
        plt.scatter(lons, lats, c='black', marker='o', s=50, label='Cities')
        for city, (lon, lat) in zip(avg_forecast_df['city_name'], zip(lons, lats)):
            plt.text(lon, lat, city, fontsize=8, ha='center', va='bottom')
        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.title('April 2025 Average Rainfall Contour Map (LSTM)')
        plt.legend()
        plt.savefig('rain_map.png', dpi=300)
        plt.close()
        print("Rainfall map saved as 'rain_map.png'")
        
        for i, date in enumerate(dates[:5]):
            daily_temps = {}
            daily_lats = []
            daily_lons = []
            daily_temp_values = []
            for city in forecast:
                if city in city_coords and i < len(forecast[city]['temp']):
                    daily_temps[city] = forecast[city]['temp'][i]
                    daily_lats.append(city_coords[city][0])
                    daily_lons.append(city_coords[city][1])
                    daily_temp_values.append(forecast[city]['temp'][i])
            if len(daily_temps) < 3:
                print(f"Not enough data points for {date.date()}, skipping map")
                continue
            try:
                temp_grid = griddata((daily_lats, daily_lons), daily_temp_values, (lat_grid, lon_grid), method='linear')
                plt.figure(figsize=(12, 8))
                contour = plt.tricontourf(daily_lons, daily_lats, daily_temp_values, levels=20, cmap='RdYlBu_r')
                plt.colorbar(contour, label='Temperature (°C)')
                plt.scatter(daily_lons, daily_lats, c='black', marker='o', s=50)
                for city, lat, lon in zip(daily_temps.keys(), daily_lats, daily_lons):
                    plt.text(lon, lat, city, fontsize=8, ha='center', va='bottom')
                plt.title(f'Temperature Map - {date.date()}')
                plt.savefig(f'temp_map_{date.date()}.png', dpi=300)
                plt.close()
            except Exception as e:
                print(f"Error generating map for {date.date()}: {e}")
    except Exception as e:
        print(f"Error generating heatmaps: {e}")

# New City Search Functionality
def plot_city_forecast(forecast_df, city_name, pdf):
    city_forecast = forecast_df[forecast_df['city'].str.lower() == city_name.lower()]
    if city_forecast.empty:
        print(f"No forecast data available for {city_name}.")
        return

    plt.figure(figsize=(12, 6))
    plt.title(f"Weather Forecast - {city_name}\n{city_forecast['date'].min()} to {city_forecast['date'].max()}", fontsize=14)
    plt.plot(city_forecast['date'], city_forecast['temp'], 'r-', label='Temperature (°C)')
    plt.bar(city_forecast['date'], city_forecast['rain'], alpha=0.5, label='Rainfall (mm)')
    plt.xlabel('Date')
    plt.ylabel('Values')
    plt.legend(loc='upper left')
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    pdf.savefig()
    plt.close()

def get_city_forecast():
    target_city = input("Enter city name to view weather information (e.g., Baguio): ").strip()
    target_city_lower = target_city.lower()
    
    city_names_lower = [c.lower() for c in daily_data['city_name'].unique()]
    if target_city_lower in city_names_lower:
        actual_city_name = next(c for c in daily_data['city_name'].unique() if c.lower() == target_city_lower)
        
        city_historical = daily_data[daily_data['city_name'] == actual_city_name]
        print(f"\nHistorical Weather Data for {actual_city_name} ({len(city_historical)} daily records):")
        print(city_historical[['datetime', 'main.temp', 'rain.1h', 'wind.speed', 'clouds.all', 'visibility']].to_string(index=False))
        
        if actual_city_name in forecast_df['city'].unique():
            city_forecast = forecast_df[forecast_df['city'] == actual_city_name]
            
            pdf_filename = f"report_{actual_city_name.lower().replace(' ', '_')}.pdf"
            with PdfPages(pdf_filename) as pdf:
                plt.figure(figsize=(10, 6))
                plt.text(0.1, 0.9, f"Historical Weather Data for {actual_city_name}", fontsize=14, ha='left')
                plt.text(0.1, 0.8, city_historical[['datetime', 'main.temp', 'rain.1h', 'wind.speed', 'clouds.all', 'visibility']].to_string(index=False), 
                         fontsize=10, fontfamily='monospace', ha='left')
                plt.axis('off')
                pdf.savefig()
                plt.close()
                
                plot_city_forecast(forecast_df, actual_city_name, pdf)
                
                plt.figure(figsize=(10, 6))
                plt.text(0.1, 0.9, f"30-Day Forecast Preview for {actual_city_name} (First 7 Days)", fontsize=14, ha='left')
                plt.text(0.1, 0.8, city_forecast.head(7).to_string(index=False), fontsize=10, fontfamily='monospace', ha='left')
                plt.axis('off')
                pdf.savefig()
                plt.close()
            
            csv_filename = f"report_{actual_city_name.lower().replace(' ', '_')}.csv"
            city_forecast.to_csv(csv_filename, index=False)
            
            print(f"\nReport saved as {pdf_filename} and {csv_filename}")
            print(f"\n30-Day Forecast Preview for {actual_city_name} (First 7 Days):")
            print(city_forecast.head(7))
        else:
            print(f"\nNo forecast data available for {actual_city_name} (insufficient data for forecasting).")
    else:
        print(f"No data available for {target_city}")

# Execute the city forecast function
get_city_forecast()