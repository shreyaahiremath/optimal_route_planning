import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Alert,
  Snackbar,
  Slide,
  Fade,
  Paper,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import axios from 'axios';
import ControlPanel from './ControlPanel';
import RouteMap from './RouteMap';
import RouteList from './RouteList';
import EvolutionChart from './EvolutionChart';

// DARK THEME configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0f',
      paper: '#14141f',
    },
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
    },
    secondary: {
      main: '#8b5cf6',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#14141f',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
  },
});

function Dashboard() {
  const [cities, setCities] = useState([]);
  const [sourceCity, setSourceCity] = useState('');
  const [destCity, setDestCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cities`);
      if (response.data && response.data.cities) {
        setCities(response.data.cities);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities. Please check if the backend is running.');
    }
  };

  const handleOptimize = async () => {
    if (!sourceCity || !destCity) {
      setError('Please select both source and destination cities');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedRoute(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/optimize-route`, {
        source: sourceCity,
        destination: destCity
      });

      if (response.data && response.data.routes) {
        const data = response.data;
        data.routes = data.routes.map((route, idx) => ({
          ...route,
          rank: idx + 1,
          distance: parseFloat(route.distance || 0),
          city_count: parseInt(route.city_count || 0, 10)
        }));
        setResult(data);
        // Auto-select the best route (rank 1)
        const bestRoute = data.routes.find(r => r.rank === 1);
        setSelectedRoute(bestRoute || data.routes[0]);
      }
    } catch (err) {
      console.error('Optimization error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Optimization failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        p: 3,
      }}>
        {/* Header */}
        <Slide direction="down" in={true} timeout={800}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Optimal Route Planner
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#94a3b8', maxWidth: 600, mx: 'auto' }}>
              Genetic Algorithm-powered route optimization with deterministic results
            </Typography>
          </Box>
        </Slide>

        <Grid container spacing={3}>
          {/* Left Panel - Controls */}
          <Grid item xs={12} md={3}>
            <Fade in={true} timeout={1000}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#14141f' }}>
                <ControlPanel
                  cities={cities}
                  sourceCity={sourceCity}
                  destCity={destCity}
                  setSourceCity={setSourceCity}
                  setDestCity={setDestCity}
                  onOptimize={handleOptimize}
                  loading={loading}
                />
              </Paper>
            </Fade>

            {/* Route List */}
            {result && (
              <Fade in={true} timeout={1200}>
                <Box sx={{ mt: 3 }}>
                  <RouteList
                    routes={result.routes}
                    bestRouteIndex={result.best_route_index}
                    selectedRoute={selectedRoute}
                    onRouteSelect={handleRouteSelect}
                    sourceName={result.source?.name}
                    destName={result.destination?.name}
                  />
                </Box>
              </Fade>
            )}
          </Grid>

          {/* Center/Right - Map */}
          <Grid item xs={12} md={9}>
            <Fade in={true} timeout={1400}>
              <Box sx={{ 
                height: '600px', 
                borderRadius: 3, 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}>
                <RouteMap
                  result={result}
                  selectedRoute={selectedRoute}
                  bestRouteIndex={result?.best_route_index}
                  onRouteSelect={handleRouteSelect}
                />
              </Box>
            </Fade>

            {/* Stats Summary */}
            {result && (
              <Slide direction="up" in={true} timeout={1000}>
                <Paper sx={{ mt: 3, p: 3, borderRadius: 3, bgcolor: '#14141f' }}>
                  <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                          {result.routes?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Routes Generated
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                          {result.routes && result.routes[0] ? 
                            `${Math.round(result.routes[0].distance).toLocaleString()}` : '0'
                          }
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Best Distance (km)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                          {result.routes && result.routes[0] ? 
                            result.routes[0].city_count : '0'
                          }
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Cities Visited
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ec4899' }}>
                          {result.evolution_stats?.total_generations || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          GA Generations
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Slide>
            )}

            {/* Algorithm Evolution Chart */}
            {result && result.generation_history && result.generation_history.length > 0 && (
              <EvolutionChart
                evolutionStats={result.evolution_stats}
                generationHistory={result.generation_history}
              />
            )}
          </Grid>
        </Grid>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" variant="filled" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default Dashboard;
