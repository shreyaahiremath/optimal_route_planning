import React from 'react';
import {
  Paper,
  Typography,
  Chip,
  Tooltip,
  Box,
  Divider,
  Card,
  CardContent,
  Zoom,
  Grow
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RouteIcon from '@mui/icons-material/Route';
import StraightenIcon from '@mui/icons-material/Straighten';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Professional geospatial color palette - soft, muted
const ROUTE_COLORS = [
  '#3B82F6', // Muted Blue - Best route
  '#14B8A6', // Teal
  '#F59E0B', // Amber  
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
];

function RouteList({ routes, bestRouteIndex, selectedRoute, onRouteSelect, sourceName, destName }) {
  // Only show available unique routes (no filler duplicates)
  const uniqueRoutes = routes || [];
  const routeCount = uniqueRoutes.length;
  
  if (!routes || routes.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 200, bgcolor: '#14141f', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#f1f5f9' }}>
          <RouteIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#3b82f6' }} />
          Generated Routes
        </Typography>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No routes available yet.
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>
            Select cities and click "Find Optimal Route" to generate paths.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const isBestRoute = (index) => index === bestRouteIndex;
  const isSelected = (route) => selectedRoute && route.rank === selectedRoute.rank;

  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, bgcolor: '#111827', border: '1px solid rgba(75, 85, 99, 0.4)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: '#E5E7EB', fontSize: '1.1rem' }}>
          <RouteIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#3B82F6', fontSize: 20 }} />
          {routeCount} Route{routeCount !== 1 ? 's' : ''}
        </Typography>
        <Chip 
          label={`Best: ${Math.round(routes[0]?.distance || 0).toLocaleString()} km`} 
          size="small"
          sx={{ 
            bgcolor: 'rgba(59, 130, 246, 0.15)', 
            color: '#60A5FA',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: 500,
            fontSize: '0.75rem'
          }} 
        />
      </Box>

      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(31, 41, 55, 0.6)', borderRadius: 1.5, border: '1px solid rgba(75, 85, 99, 0.3)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <LocationOnIcon sx={{ fontSize: 12, color: '#22C55E' }} />
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
            From: <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{sourceName}</span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon sx={{ fontSize: 12, color: '#EF4444' }} />
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
            To: <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{destName}</span>
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2, borderColor: 'rgba(75, 85, 99, 0.4)' }} />

      {/* Route Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {routes.map((route, index) => {
          const best = isBestRoute(index);
          const selected = isSelected(route);
          const color = ROUTE_COLORS[index];

          return (
            <Grow in={true} key={index} timeout={200 + index * 80}>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600, color: best ? '#60A5FA' : color }}>
                      {best ? 'Best Route' : `Route ${route.rank}`}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#9CA3AF' }}>
                      {Math.round(route.distance).toLocaleString()} km
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
                      {(route.path || route.cities || []).length} cities
                    </Typography>
                  </Box>
                }
                arrow
                placement="left"
              >
                <Card
                  onClick={() => onRouteSelect(route)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: selected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(31, 41, 55, 0.6)',
                    border: selected ? `1px solid ${color}` : '1px solid rgba(75, 85, 99, 0.4)',
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        {/* Route Number */}
                        <Box sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: best ? 'rgba(59, 130, 246, 0.2)' : 'rgba(75, 85, 99, 0.4)',
                          border: `1.5px solid ${color}`,
                        }}>
                          {best ? (
                            <EmojiEventsIcon sx={{ fontSize: 14, color }} />
                          ) : (
                            <Typography variant="caption" sx={{ fontWeight: 600, color, fontSize: '0.75rem' }}>
                              {route.rank}
                            </Typography>
                          )}
                        </Box>

                        {/* Route Info */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#E5E7EB', fontSize: '0.85rem' }}>
                              {route.path?.[0]?.name || route.cities?.[0] || sourceName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280', mx: 0.3 }}>→</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#E5E7EB', fontSize: '0.85rem' }}>
                              {route.path?.[route.path.length - 1]?.name || route.cities?.[route.cities.length - 1] || destName}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
                              {Math.round(route.distance).toLocaleString()} km
                            </Typography>
                            {best && (
                              <Chip
                                label="BEST"
                                size="small"
                                sx={{ 
                                  height: 18, 
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                                  color: '#60A5FA',
                                  border: '1px solid rgba(59, 130, 246, 0.3)'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Distance comparison */}
                      {!best && routes[0]?.distance > 0 && (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>
                            +{((route.distance - routes[0].distance) / routes[0].distance * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grow>
          );
        })}
      </Box>

      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(75, 85, 99, 0.4)' }}>
        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>
          Click any route to view on map. Blue route is optimal.
        </Typography>
      </Box>
    </Paper>
  );
}

export default RouteList;
