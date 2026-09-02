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

  const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = hasValidCoords ? [lat, lng] : [42.5, 12.5]; // Italy center view if no coords
    const initialZoom = hasValidCoords ? 16 : 5;

    // Initialize map if not created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Create draggable marker if coords are available
      if (hasValidCoords) {
        const marker = L.marker([lat, lng], {
          draggable: true,
          title: "Trascina per posizionare il punto esatto dell'evento"
        }).addTo(map);

        marker.bindPopup("📍 Posizione Evento.<br/><b>Trascina questo spillo</b> per cambiare il punto esatto.").openPopup();

        marker.on('dragend', () => {
          const newPos = marker.getLatLng();
          onLocationChange({
            lat: parseFloat(newPos.lat.toFixed(6)),
            lng: parseFloat(newPos.lng.toFixed(6))
          });
        });

        markerRef.current = marker;
      }

      // On map click to set or move pin
      map.on('click', (e) => {
        const newPos = e.latlng;
        const newLat = parseFloat(newPos.lat.toFixed(6));
        const newLng = parseFloat(newPos.lng.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          const marker = L.marker([newLat, newLng], {
            draggable: true,
            title: "Trascina per posizionare il punto esatto dell'evento"
          }).addTo(map);

          marker.bindPopup("📍 Posizione Selezionata.<br/><b>Trascina questo spillo</b> per aggiustarla.").openPopup();
          
          marker.on('dragend', () => {
            const dragPos = marker.getLatLng();
            onLocationChange({
              lat: parseFloat(dragPos.lat.toFixed(6)),
              lng: parseFloat(dragPos.lng.toFixed(6))
            });
          });

          markerRef.current = marker;
        }

        onLocationChange({ lat: newLat, lng: newLng });
      });

      mapInstanceRef.current = map;
    } else {
      // Update existing map & marker
      if (hasValidCoords && mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            draggable: true,
            title: "Trascina per posizionare il punto esatto dell'evento"
          }).addTo(mapInstanceRef.current);

          marker.on('dragend', () => {
            const dragPos = marker.getLatLng();
            onLocationChange({
              lat: parseFloat(dragPos.lat.toFixed(6)),
              lng: parseFloat(dragPos.lng.toFixed(6))
            });
          });

          markerRef.current = marker;
        }
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
  }, [lat, lng, hasValidCoords]);

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', marginTop: '8px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '240px' }} />
      <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '8px 12px', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>💡</span>
        <span>
          {hasValidCoords 
            ? "Puoi fare clic sulla mappa o trascinare lo spillo rosso per perfezionare la posizione esatta." 
            : "📌 Nessuna coordinata ancora impostata: seleziona un indirizzo o fai clic sulla mappa per posizionare lo spillo."}
        </span>
      </div>
    </div>
  );
}
