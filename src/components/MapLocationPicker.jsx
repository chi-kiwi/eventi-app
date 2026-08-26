import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapLocationPicker({ lat, lng, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat || 45.7188, lng || 8.5639],
        zoom: lat ? 16 : 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker([lat || 45.7188, lng || 8.5639], {
        draggable: true,
        title: "Trascina per posizionare il punto esatto dell'evento"
      }).addTo(map);

      marker.bindPopup("📍 Posizione Evento.<br/><b>Trascina questo spillo</b> per cambiare il punto esatto.").openPopup();

      // On marker drag end
      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        onLocationChange({
          lat: parseFloat(newPos.lat.toFixed(6)),
          lng: parseFloat(newPos.lng.toFixed(6))
        });
      });

      // On map click
      map.on('click', (e) => {
        const newPos = e.latlng;
        marker.setLatLng(newPos);
        onLocationChange({
          lat: parseFloat(newPos.lat.toFixed(6)),
          lng: parseFloat(newPos.lng.toFixed(6))
        });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Update existing map & marker
      if (lat && lng && mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', marginTop: '8px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '240px' }} />
      <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '8px 12px', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>💡</span>
        <span>Puoi fare clic sulla mappa o trascinare lo spillo rosso per perfezionare la posizione esatta.</span>
      </div>
    </div>
  );
}
