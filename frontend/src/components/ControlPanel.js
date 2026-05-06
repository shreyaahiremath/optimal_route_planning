import React from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  Typography,
  CircularProgress,
  Divider,
  Fade,
  Chip
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlagIcon from '@mui/icons-material/Flag';
import RouteIcon from '@mui/icons-material/Route';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

function ControlPanel({
  cities,
  sourceCity,
  destCity,
  setSourceCity,
  setDestCity,
  onOptimize,
  loading
}) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#f1f5f9' }}>
        <RouteIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#3b82f6' }} />
        Route Planner
      </Typography>

      <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Deterministic Badge */}
      <Chip
        icon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
        label="Deterministic GA: Seed 42"
        size="small"
        sx={{
          mb: 3,
          bgcolor: 'rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          fontSize: '0.75rem',
        }}
      />

      {/* Source City */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ mb: 1, display: 'block', color: '#94a3b8', fontWeight: 500 }}>
          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#10b981' }} />
          Source City
        </Typography>
        <Autocomplete
          value={sourceCity}
          onChange={(event, newValue) => setSourceCity(newValue || '')}
          options={cities.map(c => c.city)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select origin city..."
              size="small"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: '#f1f5f9',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: '#3b82f6' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputBase-input::placeholder': { color: '#64748b' },
              }}
            />
          )}
          sx={{
            '& .MuiAutocomplete-popupIndicator': { color: '#64748b' },
            '& .MuiAutocomplete-clearIndicator': { color: '#64748b' },
          }}
        />
      </Box>

      {/* Destination City */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="caption" sx={{ mb: 1, display: 'block', color: '#94a3b8', fontWeight: 500 }}>
          <FlagIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#ef4444' }} />
          Destination City
        </Typography>
        <Autocomplete
          value={destCity}
          onChange={(event, newValue) => setDestCity(newValue || '')}
          options={cities.map(c => c.city)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select destination city..."
              size="small"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: '#f1f5f9',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: '#3b82f6' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputBase-input::placeholder': { color: '#64748b' },
              }}
            />
          )}
          sx={{
            '& .MuiAutocomplete-popupIndicator': { color: '#64748b' },
            '& .MuiAutocomplete-clearIndicator': { color: '#64748b' },
          }}
        />
      </Box>

      {/* Optimize Button */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={onOptimize}
        disabled={loading || !sourceCity || !destCity}
        sx={{
          py: 1.5,
          borderRadius: 2,
          fontWeight: 600,
          fontSize: '1rem',
          background: loading 
            ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          textTransform: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            boxShadow: '0 6px 25px rgba(59, 130, 246, 0.6)',
          },
          '&:disabled': {
            background: 'rgba(255,255,255,0.1)',
            boxShadow: 'none',
            color: '#64748b',
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} sx={{ color: '#94a3b8' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Computing...
            </Typography>
          </Box>
        ) : (
          <>
            <RouteIcon sx={{ mr: 1 }} />
            Find Optimal Route
          </>
        )}
      </Button>

      {/* Helper text */}
      {!loading && (
        <Fade in={true}>
          <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: '#64748b' }}>
            Returns exactly 5 optimized routes
          </Typography>
        </Fade>
      )}
    </Box>
  );
}

export default ControlPanel;
