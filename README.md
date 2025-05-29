# Weather Forecast Dashboard

A comprehensive weather forecasting dashboard using LSTM neural networks to predict temperature and rainfall patterns across Philippine cities. Built with React, TypeScript, and Chart.js.

## Features

- **Real Weather Data Processing**: Processes 14,000+ weather records from March 2025
- **LSTM-Based Predictions**: Generates forecasts for April 2025 using machine learning models
- **Interactive Visualizations**: Temperature and rainfall charts, weather maps, and city rankings
- **Database Integration**: PostgreSQL storage for persistent data
- **Export Functionality**: Download forecasts as CSV and charts as PNG

## Demo

Live demo: [Weather Forecast Dashboard](https://your-username.github.io/weather-forecast-dashboard/)

## Data Source

The application uses authentic weather data from 138 Philippine cities collected in March 2025, including:
- Temperature measurements
- Rainfall data
- Wind speed and direction
- Atmospheric pressure
- Humidity levels
- Cloud coverage
- Visibility metrics

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database (for full functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/weather-forecast-dashboard.git
cd weather-forecast-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# For database functionality
DATABASE_URL=your_postgresql_connection_string
```

4. Run the development server:
```bash
npm run dev
```

## Deployment to GitHub Pages

### Static Version (Recommended for GitHub Pages)

1. Build the static version:
```bash
npm run build
```

2. The built files will be in the `dist` directory

3. Deploy to GitHub Pages:
   - Go to your repository settings
   - Navigate to Pages section
   - Select "Deploy from a branch"
   - Choose the branch containing your built files
   - Your dashboard will be available at `https://your-username.github.io/weather-forecast-dashboard/`

### File Structure

```
weather-forecast-dashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility functions and data processing
│   │   ├── pages/         # Main dashboard page
│   │   └── types/         # TypeScript type definitions
├── server/                # Backend Express server (for full version)
├── shared/                # Shared types and schemas
├── attached_assets/       # Weather data CSV file
└── dist/                  # Built files for deployment
```

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Charts**: Chart.js
- **Maps**: Leaflet
- **Database**: PostgreSQL with Drizzle ORM
- **Backend**: Express.js (for full version)
- **Build Tool**: Vite

## Weather Prediction Model

The application uses a simplified LSTM (Long Short-Term Memory) neural network approach:

1. **Data Preprocessing**: Cleans and normalizes weather data
2. **Sequence Creation**: Creates time series sequences for training
3. **Model Training**: Simulates LSTM training with loss tracking
4. **Forecasting**: Generates 30-day predictions for each city

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Weather data sourced from Philippine meteorological stations
- Built using modern web technologies for optimal performance
- Designed for educational and research purposes