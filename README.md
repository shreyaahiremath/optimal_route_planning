
# 🧬 Optimal Route Planning using Genetic Algorithm

A complete end-to-end web application that uses **Genetic Algorithms** to find optimal routes between cities using real-world geographic coordinates from the World Cities dataset.



---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [How It Works](#how-it-works)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)

---

## 🎯 Overview

This application solves the **route optimization problem** using evolutionary computation. Given a source city, destination city, and a set of intermediate cities, the Genetic Algorithm finds the shortest path that connects all cities in an optimal order.

### Real-World Applications
- 🚚 **Logistics & Delivery**: Optimize delivery routes for minimum fuel cost
- 🏥 **Emergency Services**: Find fastest paths for ambulances
- ✈️ **Tourism Planning**: Design optimal travel itineraries
- 📡 **Telecom Infrastructure**: Plan cable/tower placement

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Control Panel│  │    Map       │  │  Routes & Insights   │  │
│  │  (Inputs)    │  │ (Leaflet.js) │  │  (Charts & List)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Flask)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Genetic Algorithm Engine                    │    │
│  │  • Population Initialization    • Order Crossover (OX) │    │
│  │  • Tournament Selection         • Swap Mutation         │    │
│  │  • Fitness Evaluation           • Elitism             │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Data Layer (worldcities.csv)                │    │
│  │  • 47,000+ cities worldwide   • Lat/Lng coordinates      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔽 Input Panel
- Source & Destination city dropdowns (autocomplete-enabled)
- Number of intermediate cities slider (5-30)
- Full GA parameter controls:
  - Population size (50-300)
  - Number of generations (50-500)
  - Elite size (2-20)
  - Mutation rate (0.01-0.1)
  - Crossover rate (0.5-1.0)
  - Tournament size (2-10)
  - Selection method (Tournament / Roulette)

### 🗺️ Map Visualization
- Interactive map using **Leaflet.js**
- All generated routes displayed (faint gray)
- Selected route highlighted (orange)
- Best route highlighted (green)
- Click any route on map to view details
- Color-coded markers:
  - 🟢 Green = Source city
  - 🔴 Red = Destination city
  - 🔵 Blue = Intermediate cities

### 📊 Route Details Panel
- List of all generated routes sorted by distance
- Best route auto-highlighted with trophy badge
- Hover for detailed path preview
- Click to view route on map

### 📈 GA Insights Panel
- Convergence chart showing best & average distance over generations
- Improvement percentage calculation
- All GA parameters used for the run
- Real-time statistics:
  - Initial distance
  - Final optimal distance
  - Total improvement

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Python** | Core language |
| **Flask** | Web framework |
| **Flask-CORS** | Cross-origin requests |
| **Pandas** | Data manipulation |
| **NumPy** | Numerical operations |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Material-UI (MUI)** | Component library |
| **Leaflet.js** | Map visualization |
| **React-Leaflet** | React map bindings |
| **Recharts** | Charts & graphs |
| **Axios** | HTTP client |

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Step 1: Clone/Navigate to Project
```bash
cd Final_ML
```

### Step 2: Start Backend Server

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py
```

Backend will start at: **http://localhost:5000**

### Step 3: Start Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

Frontend will start at: **http://localhost:3000**

### Step 4: Open in Browser
Navigate to **http://localhost:3000** to use the application.

---

## 🧬 How It Works

### Genetic Algorithm Overview

```
Initialize Population (random routes)
         │
         ▼
Evaluate Fitness (1/distance)
         │
         ▼
    Selection ──────────────────────────────┐
   (Tournament/Roulette)                    │
         │                                  │
         ▼                                  │
    Crossover (Order Crossover - OX)        │ Repeat
         │                                  │  for N
         ▼                                  │ generations
    Mutation (Swap)                         │
         │                                  │
         ▼                                  │
   New Population ──────────────────────────┘
         │
         ▼
   Best Route Found ✅
```

### Key GA Components

| Component | Implementation |
|-----------|----------------|
| **Chromosome** | Route sequence: [Source, City₁, City₂, ..., Destination] |
| **Fitness** | Inverse of total Haversine distance: `1 / distance` |
| **Selection** | Tournament (k=5) or Roulette Wheel |
| **Crossover** | Order Crossover (OX) - preserves city order |
| **Mutation** | Swap Mutation - exchanges two random cities |
| **Elitism** | Top N routes preserved unchanged |

### Distance Calculation
Uses **Haversine formula** for accurate great-circle distance between geographic coordinates:

```
d = 2r × arcsin(√sin²(Δφ/2) + cos(φ₁)cos(φ₂)sin²(Δλ/2))
```

Where `r` is Earth's radius (6371 km).

---

## 📡 API Documentation

### Endpoints

#### 1. Get All Cities
```
GET /cities
```
Returns list of all available cities from the dataset.

**Response:**
```json
{
  "cities": [
    {"city": "Tokyo", "lat": 35.6897, "lng": 139.6922},
    {"city": "Delhi", "lat": 28.61, "lng": 77.23}
  ],
  "count": 47870
}
```

#### 2. Optimize Route (Main Endpoint)
```
POST /optimize-route
```

**Request Body:**
```json
{
  "source": "Tokyo",
  "destination": "New York",
  "intermediate_count": 15,
  "pop_size": 100,
  "generations": 150,
  "elite_size": 10,
  "mutation_rate": 0.03,
  "crossover_rate": 0.8,
  "tournament_size": 5,
  "selection_method": "tournament"
}
```

**Response:**
```json
{
  "source": {"name": "Tokyo", "lat": 35.6897, "lng": 139.6922},
  "destination": {"name": "New York", "lat": 40.6943, "lng": -73.9249},
  "intermediate_selected": 15,
  "ga_parameters": { ... },
  "best_route": {
    "path": [ ... ],
    "distance_km": 18542.53,
    "city_count": 17
  },
  "all_routes": [ ... ],
  "total_routes_found": 50,
  "convergence_history": {
    "generations": [1, 2, ...],
    "best_distances": [25000, 24000, ...],
    "avg_distances": [32000, 30000, ...]
  }
}
```

#### 3. Health Check
```
GET /health
```
Returns server status and cities count.

---

## 🖼️ Screenshots

### Dashboard Overview
The main interface features a 3-panel layout:
- **Left**: Configuration panel with city selection and GA controls
- **Center**: Interactive map with all routes visualized
- **Right**: Route list and convergence analytics

### Map Visualization
Routes are color-coded for easy identification:
- 🟢 **Green** = Optimal (best) route
- 🟠 **Orange** = Currently selected route
- ⚪ **Gray** = Alternative generated routes

### Convergence Chart
Shows GA evolution over generations:
- Solid green line = Best distance per generation
- Dashed blue line = Average population distance

---

## 🎓 Genetic Algorithm Details

### Population Initialization
```python
def create_population(pop_size, num_intermediate):
    population = []
    base = list(range(num_intermediate))
    for _ in range(pop_size):
        individual = base.copy()
        random.shuffle(individual)
        population.append(individual)
    return population
```

### Order Crossover (OX)
1. Select random segment from Parent 1
2. Copy segment to child at same position
3. Fill remaining positions from Parent 2 in order
4. Skip any cities already present

### Tournament Selection
```python
def tournament_selection(population, tournament_size=5):
    competitors = random.sample(population, tournament_size)
    winner = max(competitors, key=lambda route: fitness(route))
    return winner
```

### Fitness Function
```python
def fitness(route, source_idx, dest_idx, coords):
    full_route = [source_idx] + route + [dest_idx]
    dist = total_route_distance(full_route, coords)
    return 1.0 / dist  # Higher fitness = shorter distance
```

---

## 🚨 Troubleshooting

### Backend won't start
- Check Python version (3.8+ required)
- Verify all dependencies installed: `pip list`
- Check port 5000 not in use: `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows)

### Frontend won't start
- Check Node.js version (16+ required): `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for port conflicts on 3000

### CORS errors
- Backend must be running before frontend
- Check `flask-cors` is installed

### Map not loading
- Check internet connection (Leaflet tiles load from CDN)
- Verify `react-leaflet` installed correctly

---

## 📁 Project Structure

```
Final_ML/
├── backend/
│   ├── app.py              # Flask API & GA implementation
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js      # Main layout
│   │   │   ├── ControlPanel.js # Input controls
│   │   │   ├── RouteMap.js       # Map visualization
│   │   │   ├── RouteList.js      # Route display
│   │   │   └── GAInsights.js     # Charts & stats
│   │   ├── App.js          # App wrapper
│   │   └── index.js        # Entry point
│   └── package.json        # Node dependencies
├── worldcities.csv         # Dataset (47,000+ cities)
├── GA_Route_Planning.ipynb # Original research notebook
└── README.md               # This file
```

---

## 📚 Additional Resources

- [Genetic Algorithms Explained](https://towardsdatascience.com/introduction-to-genetic-algorithms-including-example-code-e396e98d8bf3)
- [Traveling Salesman Problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [Material-UI Components](https://mui.com/components/)

---

## 📝 License

This project is built for educational purposes as a final-year Machine Learning project.

**Author**: Student Developer  
**Institution**: [Your University]  
**Year**: 2024

---

## 🙏 Acknowledgments

- Dataset: [SimpleMaps World Cities Database](https://simplemaps.com/data/world-cities)
- Icons: [Material Icons](https://fonts.google.com/icons)
- Maps: [OpenStreetMap](https://www.openstreetmap.org/)

---

**Happy Routing! 🚀**
=======
# optimal_route_planning
Genetic Algorithm–based route optimization system that identifies efficient travel paths between cities using geospatial coordinates. The project visualizes multiple possible routes, highlights the optimal route, and displays path costs interactively on a map dashboard.Built using Python, Flask, React, and real-world city datasets.
>>>>>>> 0154568f0cd1883dd9533c7ca9f483cec25340b4
