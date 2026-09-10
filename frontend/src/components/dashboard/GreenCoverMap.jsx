import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Card from '../common/Card';

/**
 * Helper component to recenter Leaflet map when lat/lng change
 */
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 12, { animate: true });
  }, [lat, lng, map]);
  return null;
}

/**
 * Green Cover Map Component
 */
export default function GreenCoverMap({ 
  cityName, 
  lat = 18.5204, 
  lng = 73.8567, 
  greenCoverPercent = 32,
  loading = false 
}) {
  if (loading) {
    return (
      <Card title="Green Cover Map">
        <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
      </Card>
    );
  }

  const radiusKm = 5 + (greenCoverPercent / 100) * 10;
  const radiusMeters = radiusKm * 1000;

  return (
    <Card title="Green Cover & Eco-Zones">
      <div className="space-y-4">
        {/* Map Container */}
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '400px' }}>
          <MapContainer
            center={[lat, lng]}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
          >
            <RecenterMap lat={lat} lng={lng} />

            {/* OpenStreetMap Tile Layer */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />

            {/* Green Cover Zone Circle */}
            <Circle
              center={[lat, lng]}
              radius={radiusMeters}
              pathOptions={{
                color: '#059669',
                weight: 2,
                opacity: 0.7,
                fill: true,
                fillColor: '#10b981',
                fillOpacity: 0.25,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-900">Green Coverage Zone</p>
                  <p>Estimated: <strong>{greenCoverPercent}%</strong></p>
                  <p>Radius: <strong>{radiusKm.toFixed(1)} km</strong></p>
                </div>
              </Popup>
            </Circle>

            {/* City Center Marker */}
            <Circle
              center={[lat, lng]}
              radius={600}
              pathOptions={{
                color: '#047857',
                weight: 3,
                opacity: 1,
                fill: true,
                fillColor: '#047857',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="text-xs font-bold text-slate-900">{cityName} Center</div>
              </Popup>
            </Circle>
          </MapContainer>
        </div>

        {/* Map Info */}
        <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 space-y-2 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <div>
                <p className="font-bold text-slate-900">{cityName}</p>
                <p className="text-[11px] text-slate-500">Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-700">Green Cover: {greenCoverPercent}%</p>
              <p className="text-[11px] text-slate-500">Radius: {radiusKm.toFixed(1)} km</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-500">
            <span>ℹ️</span>
            <span><strong>Data Source:</strong> Real-time OpenStreetMap GIS satellite land-use calculations.</span>
          </div>
        </div>
      </div>
    </Card>
  );
}