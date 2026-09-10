import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Custom Pin SVG DivIcon
const pickerPinIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #ffffff;
      box-shadow: 0 6px 16px rgba(4, 120, 87, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      position: relative;
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
      "></div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

/**
 * Helper to update map view and invalidate dimensions when container opens in modal
 */
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1] && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom() < 13 ? 14 : map.getZoom());
    }

    // Leaflet needs to recalculate tile size inside dynamic modals/tabs
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [center, map]);

  return null;
}

/**
 * Listens for user clicks on the map to place/move the pin
 */
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect && e.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/**
 * Interactive Location Picker Map Component for Complaint Reporting
 */
export default function LocationPickerMap({
  lat,
  lng,
  onLocationSelect,
  isGeocoding = false,
  address = '',
  className = 'h-64 sm:h-72',
}) {
  const markerRef = useRef(null);

  const safeLat = parseFloat(lat) || 18.5204;
  const safeLng = parseFloat(lng) || 73.8567;
  const centerPosition = useMemo(() => [safeLat, safeLng], [safeLat, safeLng]);

  // Marker drag handlers
  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          if (onLocationSelect) {
            onLocationSelect(newPos.lat, newPos.lng);
          }
        }
      },
    }),
    [onLocationSelect]
  );

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-emerald-200/80 shadow-sm bg-slate-100 ${className}`}>
      <MapContainer
        center={centerPosition}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={centerPosition} />
        <MapClickHandler onLocationSelect={onLocationSelect} />

        <Marker
          draggable={true}
          eventHandlers={markerEventHandlers}
          position={centerPosition}
          icon={pickerPinIcon}
          ref={markerRef}
        >
          <Popup offset={[0, -20]}>
            <div className="p-1 text-center font-sans text-xs space-y-1">
              <p className="font-extrabold text-emerald-800 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Selected Location</span>
              </p>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                {address || 'Drag this pin or tap map to adjust.'}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Top Floating Helper Banner */}
      <div className="absolute top-3 left-3 right-3 z-[400] pointer-events-none flex items-center justify-between gap-2">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-medium shadow-md flex items-center gap-1.5 pointer-events-auto">
          <Navigation className="w-3 h-3 text-emerald-400" />
          <span>Click anywhere or drag pin to adjust exact location</span>
        </div>

        {isGeocoding && (
          <div className="bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1.5 animate-pulse pointer-events-auto">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Resolving address...</span>
          </div>
        )}
      </div>

      {/* Bottom Coordinates Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-[11px] font-mono shadow-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>
          {safeLat.toFixed(5)}°, {safeLng.toFixed(5)}°
        </span>
      </div>
    </div>
  );
}
