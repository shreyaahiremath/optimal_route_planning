import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ═══════════════════════════════════════════════════════════════════════════════
// PROFESSIONAL GEOSPATIAL COLOR PALETTE
// Soft, muted colors for data-focused interface
// ═══════════════════════════════════════════════════════════════════════════════
const ROUTE_COLORS = [
  '#3B82F6', // Muted Blue - Best route (professional, calm)
  '#14B8A6', // Teal - Alternative 1
  '#F59E0B', // Amber - Alternative 2  
  '#8B5CF6', // Violet - Alternative 3
  '#06B6D4', // Cyan - Alternative 4
];

const ROUTE_WEIGHTS = [4, 2, 2, 2, 2]; // Best slightly thicker
const ROUTE_OPACITY = 0.75; // Softer default visibility
const ALT_ROUTE_OPACITY = 0.5; // Alternative routes more subtle

// Fix default icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Professional geospatial markers - soft, subtle styling
const createCustomIcon = (color, size = 14, borderColor = '#111827') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: 2px solid ${borderColor}; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Soft, professional marker colors
const sourceIcon = createCustomIcon('#22C55E', 16, '#111827');      // Soft green
const destIcon = createCustomIcon('#EF4444', 16, '#111827');        // Soft red
const intermediateIcon = createCustomIcon('#F59E0B', 12, '#111827'); // Neutral amber

// Map bounds fitter component
function MapFitter({ routes }) {
  const map = useMap();
  useEffect(() => {
    if (routes && routes.length > 0) {
      const allCoords = routes.flatMap(r => r.coordinates || []);
      if (allCoords.length > 0) {
        const latLngBounds = L.latLngBounds(allCoords.map(c => [c[0], c[1]]));
        map.fitBounds(latLngBounds, { padding: [100, 100], maxZoom: 6 });
      }
    }
  }, [routes, map]);
  return null;
}

// Professional hover tooltip - clean, minimal
function RouteTooltip({ route, color }) {
  const positions = route.coordinates || route.path?.map(p => [p.lat, p.lng]) || [];
  const midIndex = Math.floor(positions.length / 2);
  const midPoint = positions[midIndex];
  
  if (!midPoint) return null;
  
  const distance = route.distance || 0;
  const isBest = route.rank === 1;
  
  return (
    <Marker 
      position={midPoint} 
      icon={L.divIcon({
        className: 'route-tooltip',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            color: #E5E7EB;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            border: 1px solid rgba(59, 130, 246, 0.3);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
          ">
            <div style="font-weight: 600; color: ${color}; margin-bottom: 2px;">
              ${isBest ? '★ Best Route' : `Route #${route.rank}`}
            </div>
            <div style="color: #9CA3AF;">
              ${Math.round(distance).toLocaleString()} km
            </div>
          </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 25],
      })}
      interactive={false}
    />
  );
}

function RouteMap({ result, selectedRoute, bestRouteIndex, onRouteSelect }) {
  const defaultCenter = [20, 0];
  const defaultZoom = 2;
  const [hoveredRoute, setHoveredRoute] = useState(null);

  // Get all routes from result
  const routes = useMemo(() => result?.routes || [], [result]);

  // Initial empty state
  if (!result || !selectedRoute) {
    return (
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%', background: '#0a0a0f' }}>
        {/* Dark theme map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: '#1F2937',
          padding: '32px 48px',
          borderRadius: '12px',
          textAlign: 'center',
          zIndex: 1000,
          border: '1px solid rgba(75, 85, 99, 0.5)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{ margin: 0, marginBottom: '12px', fontSize: '22px', color: '#E5E7EB', fontWeight: 500 }}>🗺️ Map Ready</h2>
          <p style={{ margin: 0, color: '#9CA3AF', fontSize: '14px', lineHeight: 1.6 }}>
            Select cities and click "Find Optimal Route"<br/>
            <span style={{ color: '#6B7280' }}>Routes will appear here</span>
          </p>
        </div>
      </MapContainer>
    );
  }

  return (
    <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%', background: '#0a0a0f' }}>
      {/* DARK THEME MAP TILES */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapFitter routes={routes} />

      {/* Render routes with professional styling */}
      {routes.map((route, idx) => {
        const positions = route.coordinates || route.path?.map(p => [p.lat, p.lng]) || [];
        if (positions.length === 0) return null;
        
        const isSelected = selectedRoute && route.rank === selectedRoute.rank;
        const isBest = idx === bestRouteIndex || route.rank === 1;
        const isHovered = hoveredRoute === route.rank;
        
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        const baseWeight = ROUTE_WEIGHTS[idx % ROUTE_WEIGHTS.length];
        
        // Hover/selection states
        const weight = isHovered || isSelected ? baseWeight + 1.5 : baseWeight;
        const opacity = isHovered ? 0.95 : isSelected ? 0.9 : (isBest ? ROUTE_OPACITY : ALT_ROUTE_OPACITY);
        const zIndex = isBest ? 100 : isSelected ? 50 : 10 - idx;

        return (
          <React.Fragment key={idx}>
            {/* Subtle glow for best route only */}
            {isBest && (
              <Polyline
                positions={positions}
                color={color}
                weight={weight + 3}
                opacity={0.15}
                zIndex={zIndex - 1}
                interactive={false}
              />
            )}
            {/* Main route line */}
            <Polyline
              positions={positions}
              color={color}
              weight={weight}
              opacity={opacity}
              zIndex={zIndex}
              eventHandlers={{
                click: () => onRouteSelect(route),
                mouseover: () => setHoveredRoute(route.rank),
                mouseout: () => setHoveredRoute(null),
              }}
              style={{ transition: 'all 200ms ease' }}
            />
            {/* Tooltip on hover */}
            {isHovered && (
              <RouteTooltip route={route} color={color} />
            )}
          </React.Fragment>
        );
      })}

      {/* Clean, professional markers */}
      {selectedRoute && (selectedRoute.path || selectedRoute.cities)?.map((city, idx, arr) => {
        const cityName = city.name || city;
        const lat = city.lat || (selectedRoute.coordinates?.[idx]?.[0]);
        const lng = city.lng || (selectedRoute.coordinates?.[idx]?.[1]);
        
        if (lat === undefined || lng === undefined) return null;
        
        let icon = intermediateIcon;
        let title = cityName;
        let markerColor = '#F59E0B';
        
        if (idx === 0) {
          icon = sourceIcon;
          title = `${cityName} (Source)`;
          markerColor = '#22C55E';
        } else if (idx === arr.length - 1) {
          icon = destIcon;
          title = `${cityName} (Destination)`;
          markerColor = '#EF4444';
        }

        return (
          <Marker key={`${selectedRoute.rank}-${idx}`} position={[lat, lng]} icon={icon}>
            <Popup>
              <div style={{ 
                textAlign: 'center', 
                background: '#1F2937', 
                padding: '10px 14px', 
                borderRadius: '6px',
                border: `1px solid ${markerColor}`,
                minWidth: '140px'
              }}>
                <strong style={{ fontSize: '13px', color: '#E5E7EB', display: 'block', marginBottom: '4px' }}>
                  {idx + 1}. {title}
                </strong>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Professional Legend - minimal, clean */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(17, 24, 39, 0.92)',
        padding: '14px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        fontSize: '12px',
        minWidth: '140px',
        border: '1px solid rgba(75, 85, 99, 0.4)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 600, fontSize: '13px', color: '#E5E7EB' }}>
          {routes.length} Route{routes.length !== 1 ? 's' : ''}
        </div>
        
        {routes.slice(0, 3).map((route, idx) => {
          const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
          const isBest = idx === 0;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ 
                width: '20px', 
                height: isBest ? '3px' : '2px', 
                background: color, 
                borderRadius: '1px',
                opacity: isBest ? 1 : 0.7
              }}></div>
              <span style={{ 
                color: isBest ? '#E5E7EB' : '#9CA3AF', 
                fontWeight: isBest ? 500 : 400,
                fontSize: '12px'
              }}>
                {isBest ? 'Best Route' : `Alt ${idx}`}
              </span>
            </div>
          );
        })}
        {routes.length > 3 && (
          <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '4px' }}>
            +{routes.length - 3} more
          </div>
        )}
        
        <div style={{ borderTop: '1px solid rgba(75, 85, 99, 0.4)', paddingTop: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></div>
            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>Source</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>Destination</span>
          </div>
        </div>
      </div>

      {/* Professional Route Info Panel */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(17, 24, 39, 0.95)',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        fontSize: '13px',
        minWidth: '200px',
        border: selectedRoute?.rank === 1 ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(75, 85, 99, 0.4)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: '12px', 
          color: '#E5E7EB',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🛣️</span> 
          <span style={{ color: selectedRoute?.rank === 1 ? '#3B82F6' : '#9CA3AF' }}>
            Route #{selectedRoute?.rank || 1}
          </span>
          {selectedRoute?.rank === 1 && (
            <span style={{ 
              background: 'rgba(59, 130, 246, 0.2)', 
              color: '#60A5FA', 
              padding: '2px 8px', 
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>BEST</span>
          )}
        </div>
        
        <div style={{ marginBottom: '8px', color: '#9CA3AF', fontSize: '12px' }}>
          <span style={{ color: '#6B7280' }}>From:</span> 
          <span style={{ color: '#22C55E', marginLeft: '4px', fontWeight: 500 }}>{result?.source?.name || 'Source'}</span>
        </div>
        <div style={{ marginBottom: '12px', color: '#9CA3AF', fontSize: '12px' }}>
          <span style={{ color: '#6B7280' }}>To:</span> 
          <span style={{ color: '#EF4444', marginLeft: '4px', fontWeight: 500 }}>{result?.destination?.name || 'Destination'}</span>
        </div>
        
        <div style={{ 
          marginBottom: '10px', 
          padding: '10px 12px', 
          background: 'rgba(31, 41, 55, 0.6)', 
          borderRadius: '6px',
          borderLeft: `3px solid ${selectedRoute?.rank === 1 ? '#3B82F6' : '#6B7280'}`
        }}>
          <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distance</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#E5E7EB' }}>
            {Math.round(selectedRoute?.distance || 0).toLocaleString()} km
          </div>
        </div>
        
        <div style={{ fontSize: '11px', color: '#6B7280' }}>
          {(selectedRoute?.city_count || 2) - 2} stops via intermediate cities
        </div>
      </div>

      {/* Subtle instructions */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(17, 24, 39, 0.85)',
        padding: '8px 16px',
        borderRadius: '20px',
        zIndex: 1000,
        fontSize: '11px',
        color: '#9CA3AF',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        pointerEvents: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Hover to preview • Click to select
      </div>
    </MapContainer>
  );
}

export default RouteMap;
