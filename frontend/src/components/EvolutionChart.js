import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  Fade
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import UpdateIcon from '@mui/icons-material/Update';

function EvolutionChart({ evolutionStats, generationHistory }) {
  // Handle missing data
  if (!generationHistory || generationHistory.length === 0) {
    return null;
  }

  const { total_generations, initial_best, final_best, improvement_percent } = evolutionStats || {};

  // Format data for Recharts
  const chartData = generationHistory.map(point => ({
    generation: point.generation,
    best: point.best,
    average: point.average,
    worst: point.worst
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(75, 85, 99, 0.4)',
            borderRadius: 1,
            p: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Generation {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              variant="caption"
              sx={{
                color: entry.color,
                display: 'block',
                fontSize: '0.75rem'
              }}
            >
              {entry.name}: {Math.round(entry.value).toLocaleString()} km
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Fade in={true} timeout={500}>
      <Paper
        elevation={1}
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: '#111827',
          border: '1px solid rgba(75, 85, 99, 0.4)',
          mt: 2
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: '#E5E7EB', fontSize: '1rem' }}>
            <ShowChartIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#3B82F6', fontSize: 20 }} />
            Algorithm Evolution
          </Typography>
          <Chip
            icon={<TrendingDownIcon sx={{ fontSize: 14 }} />}
            label={`${improvement_percent?.toFixed(1)}% improved`}
            size="small"
            sx={{
              bgcolor: 'rgba(34, 197, 94, 0.15)',
              color: '#22C55E',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          />
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(31, 41, 55, 0.6)',
                borderRadius: 1.5,
                border: '1px solid rgba(75, 85, 99, 0.3)',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.3, fontSize: '0.65rem' }}>
                GENERATIONS
              </Typography>
              <Typography variant="body2" sx={{ color: '#E5E7EB', fontWeight: 600, fontSize: '0.9rem' }}>
                {total_generations}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(31, 41, 55, 0.6)',
                borderRadius: 1.5,
                border: '1px solid rgba(75, 85, 99, 0.3)',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.3, fontSize: '0.65rem' }}>
                INITIAL BEST
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.9rem' }}>
                {Math.round(initial_best).toLocaleString()} km
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(59, 130, 246, 0.15)',
                borderRadius: 1.5,
                border: '1px solid rgba(59, 130, 246, 0.3)',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#3B82F6', display: 'block', mb: 0.3, fontSize: '0.65rem' }}>
                FINAL BEST
              </Typography>
              <Typography variant="body2" sx={{ color: '#60A5FA', fontWeight: 600, fontSize: '0.9rem' }}>
                {Math.round(final_best).toLocaleString()} km
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(34, 197, 94, 0.15)',
                borderRadius: 1.5,
                border: '1px solid rgba(34, 197, 94, 0.3)',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#22C55E', display: 'block', mb: 0.3, fontSize: '0.65rem' }}>
                IMPROVEMENT
              </Typography>
              <Typography variant="body2" sx={{ color: '#4ADE80', fontWeight: 600, fontSize: '0.9rem' }}>
                {improvement_percent?.toFixed(1)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Improvement Text */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(31, 41, 55, 0.4)', borderRadius: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.85rem', textAlign: 'center' }}>
            <UpdateIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5, color: '#6B7280' }} />
            Improved from <strong style={{ color: '#E5E7EB' }}>{Math.round(initial_best).toLocaleString()} km</strong>
            {' → '}
            <strong style={{ color: '#60A5FA' }}>{Math.round(final_best).toLocaleString()} km</strong>
            {' '}
            <span style={{ color: '#22C55E' }}>({improvement_percent?.toFixed(1)}% improvement)</span>
          </Typography>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 280, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(75, 85, 99, 0.3)"
                vertical={false}
              />
              <XAxis
                dataKey="generation"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickLine={{ stroke: '#6B7280' }}
                axisLine={{ stroke: 'rgba(75, 85, 99, 0.4)' }}
                label={{ value: 'Generation', position: 'insideBottom', offset: -5, fill: '#6B7280', fontSize: 11 }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickLine={{ stroke: '#6B7280' }}
                axisLine={{ stroke: 'rgba(75, 85, 99, 0.4)' }}
                label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 11 }}
                tickFormatter={(value) => Math.round(value).toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
              />
              
              {/* Worst Distance */}
              <Line
                type="monotone"
                dataKey="worst"
                name="Worst"
                stroke="#FCA5A5"
                strokeWidth={1.5}
                dot={false}
                strokeOpacity={0.6}
                activeDot={{ r: 4, fill: '#FCA5A5' }}
              />
              
              {/* Average Distance */}
              <Line
                type="monotone"
                dataKey="average"
                name="Average"
                stroke="#9CA3AF"
                strokeWidth={1.5}
                dot={false}
                strokeOpacity={0.7}
                activeDot={{ r: 4, fill: '#9CA3AF' }}
              />
              
              {/* Best Distance */}
              <Line
                type="monotone"
                dataKey="best"
                name="Best"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#60A5FA' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Legend Note */}
        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1.5, textAlign: 'center', fontSize: '0.7rem' }}>
          The genetic algorithm converges as the best route distance decreases over generations.
        </Typography>
      </Paper>
    </Fade>
  );
}

export default EvolutionChart;
