
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationData, UserRole } from '../types';

interface TacticalMapProps {
  myLocation: LocationData | null;
  peerLocation: LocationData | null;
  myRole: UserRole;
}

const TacticalMap: React.FC<TacticalMapProps> = ({ myLocation, peerLocation, myRole }) => {
  const mapRef = useRef<L.Map | null>(null);
  const myMarkerRef = useRef<L.Marker | null>(null);
  const peerMarkerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map with high-visibility settings
    const map = L.map(containerRef.current, {
      zoomControl: true, // Re-enabled zoom control for better navigation
      attributionControl: false,
      fadeAnimation: true,
      markerZoomAnimation: true,
    }).setView([0, 0], 2);

    // Using CartoDB Voyager - a much brighter, clearer tile set than Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    mapRef.current = map;

    // Force a resize calculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Update Local Node Marker
    if (myLocation) {
      const pos: L.LatLngExpression = [myLocation.lat, myLocation.lng];
      if (!myMarkerRef.current) {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(34,197,94,1)] animate-pulse flex items-center justify-center">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        myMarkerRef.current = L.marker(pos, { icon })
          .addTo(mapRef.current)
          .bindTooltip(`ME (NODE_${myRole})`, { 
            permanent: true, 
            direction: 'top', 
            offset: [0, -10] 
          });
        
        mapRef.current.setView(pos, 14);
      } else {
        myMarkerRef.current.setLatLng(pos);
      }
    }

    // Update Peer Node Marker
    if (peerLocation) {
      const pos: L.LatLngExpression = [peerLocation.lat, peerLocation.lng];
      const peerRole = myRole === UserRole.USER_A ? UserRole.USER_B : UserRole.USER_A;
      if (!peerMarkerRef.current) {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-[0_0_20px_rgba(220,38,38,1)] animate-pulse flex items-center justify-center">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        peerMarkerRef.current = L.marker(pos, { icon })
          .addTo(mapRef.current)
          .bindTooltip(`PEER (${peerRole})`, { 
            permanent: true, 
            direction: 'top', 
            offset: [0, -10] 
          });
      } else {
        peerMarkerRef.current.setLatLng(pos);
      }
    }
  }, [myLocation, peerLocation, myRole]);

  return (
    <div className="w-full h-full relative border-2 border-green-500/50 rounded-lg overflow-hidden bg-[#111]">
      <div ref={containerRef} className="w-full h-full z-0" />
      
      {/* Legend Overlays */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2 pointer-events-none">
        <div className="bg-black/95 border-2 border-green-500 px-4 py-2 rounded shadow-xl text-[10px] uppercase tracking-widest text-green-500 font-black backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
             PRIMARY_UPLINK_FIXED
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-[1000] space-y-2 pointer-events-none">
         <div className="bg-black/90 border border-green-900/50 p-3 rounded-lg backdrop-blur-sm">
            <h4 className="text-[9px] text-green-700 font-bold uppercase mb-1">Satellite Telemetry</h4>
            <div className="text-[11px] text-green-400 font-mono">
                {myLocation ? `LAT: ${myLocation.lat.toFixed(6)} | LNG: ${myLocation.lng.toFixed(6)}` : 'ACQUIRING_GPS...'}
            </div>
         </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] bg-black/90 border border-green-900/50 px-3 py-1 rounded text-[8px] text-green-800 uppercase tracking-tighter backdrop-blur-sm">
        ACTIVE_LAYER: VOYAGER_TACTICAL_v5.0 // NO_FILTER_MODE
      </div>
    </div>
  );
};

export default TacticalMap;
