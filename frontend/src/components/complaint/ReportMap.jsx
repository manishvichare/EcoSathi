import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl';

// Custom status-styled SVG divIcons for Leaflet
const createPinIcon = (color, borderColor) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const redIcon = createPinIcon('#ef4444', '#b91c1c'); // Open
const amberIcon = createPinIcon('#f59e0b', '#d97706'); // In Progress
const greenIcon = createPinIcon('#10b981', '#047857'); // Resolved

/**
 * Interactive Report Map Component
 */
export default function ReportMap({ reports = [], center = [18.5204, 73.8567], onViewReport }) {
  // Ensure valid coordinates
  const validReports = reports.filter((r) => r.lat && r.lng);

  return (
    <div className="w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-md relative z-10">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validReports.map((report) => {
          const lat = parseFloat(report.lat);
          const lng = parseFloat(report.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          const isResolved = report.status === 'resolved' || report.status === 'verified';
          const isInProgress = report.status === 'in_progress' || report.status === 'assigned';
          const icon = isResolved ? greenIcon : isInProgress ? amberIcon : redIcon;

          return (
            <Marker key={report.id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="w-64 p-3 space-y-2.5 font-sans">
                  {/* Photo preview */}
                  {(report.photo || report.photo_url) && (
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={resolveImageUrl(report.photo || report.photo_url)}
                        alt={report.title || 'Report preview'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {report.category || 'Environment'}
                      </span>
                      <span className={`text-[10px] font-black uppercase ${
                        isResolved ? 'text-emerald-700' : isInProgress ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {report.status?.replace('_', ' ') || 'Open'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                      {report.title || report.description?.slice(0, 35) + '...'}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-teal-600" />
                      {Number(report.supportCount) > 0 ? `${report.supportCount} Supporting` : '0 Supporting'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewReport && onViewReport(report)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-md flex items-center gap-4 text-xs font-bold text-slate-700">
        <span className="text-[10px] uppercase font-black text-slate-400">Map Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span>Open</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
}
