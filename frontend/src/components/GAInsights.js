import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

function GAInsights({ history, gaParams }) {
  if (!history || !history.generations) {
    return null;
  }

  // Prepare chart data
  const chartData = history.generations.map((gen, idx) => ({
    generation: gen,
    bestDistance: history.best_distances[idx],
    avgDistance: history.avg_distances[idx],
    bestFitness: history.best_fitness[idx]
  }));

  // Calculate improvement
  const initialDist = history.best_distances[0];
  const finalDist = history.best_distances[history.best_distances.length - 1];
  const improvement = ((initialDist - finalDist) / initialDist * 100).toFixed(2);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <TrendingUpIcon sx={{ mr: 1 }} color="primary" />
        GA Insights
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Statistics */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(25, 118, 210, 0.1)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Initial Distance
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              {initialDist.toLocaleString()} km
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Final Distance
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              {finalDist.toLocaleString()} km
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Improvement
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="warning.main">
              {improvement}%
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      {/* Convergence Chart */}
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Convergence Chart
      </Typography>

      <Box sx={{ height: 200, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="generation" 
              tick={{ fontSize: 10 }}
              tickCount={5}
              label={{ value: 'Generation', position: 'insideBottom', offset: -2, fontSize: 10 }}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ fontSize: 12, padding: 8 }}
              formatter={(value) => [value.toLocaleString() + ' km', '']}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="bestDistance"
              name="Best Distance"
              stroke="#4caf50"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="avgDistance"
              name="Avg Distance"
              stroke="#2196f3"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* GA Parameters Display */}
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SettingsIcon sx={{ mr: 0.5, fontSize: 16 }} />
        Parameters Used
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip 
          label={`Pop: ${gaParams?.pop_size || '-'}`} 
          size="small" 
          variant="outlined" 
          sx={{ fontSize: '0.7rem' }}
        />
        <Chip 
          label={`Gen: ${gaParams?.generations || '-'}`} 
          size="small" 
          variant="outlined" 
          sx={{ fontSize: '0.7rem' }}
        />
        <Chip 
          label={`Elite: ${gaParams?.elite_size || '-'}`} 
          size="small" 
          variant="outlined" 
          sx={{ fontSize: '0.7rem' }}
        />
        <Chip 
          label={`Mut: ${gaParams?.mutation_rate || '-'}`} 
          size="small" 
          variant="outlined" 
          sx={{ fontSize: '0.7rem' }}
        />
        <Chip 
          label={`CX: ${gaParams?.crossover_rate || '-'}`} 
          size="small" 
          variant="outlined" 
          sx={{ fontSize: '0.7rem' }}
        />
        <Chip 
          label={gaParams?.selection_method || '-'} 
          size="small" 
          color="primary"
          sx={{ fontSize: '0.7rem' }}
        />
      </Box>
    </Paper>
  );
}

export default GAInsights;
