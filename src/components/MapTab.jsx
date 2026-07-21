import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Compass as GpsIcon, AlertTriangle, AlertCircle } from 'lucide-react';
import { db, getDistance } from '../services/db';
import { useLanguage } from '../services/i18n.jsx';

const LOCATIONS = {
  "Milano": { lat: 45.4642, lng: 9.1900 },
  "Saronno": { lat: 45.6264, lng: 9.0347 },
  "Monza": { lat: 45.5845, lng: 9.2740 },
  "Oleggio": { lat: 45.5982, lng: 8.6369 },
  "Bergamo": { lat: 45.6983, lng: 9.6773 },
  "Sondrio": { lat: 46.2415, lng: 9.6372 }
};

export default function MapTab({ events, onSelectEvent, user }) {
  const { language, t } = useLanguage();
  const [userLocationName, setUserLocationName] = useState("Milano");
  const [userCoords, setUserCoords] = useState(LOCATIONS["Milano"]);
  const [radiusFilter, setRadiusFilter] = useState(50); // 10, 25, 50, 100 km
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [onRoadNotification, setOnRoadNotification] = useState(null);

  useEffect(() => {
    if (user && user.comune && LOCATIONS[user.comune]) {
      setUserLocationName(user.comune);
      setUserCoords(LOCATIONS[user.comune]);
    }
  }, [user]);

  // Trigger On-the-road notification when user moves to a new location
  const handleLocationChange = (name) => {
    setUserLocationName(name);
    const coords = LOCATIONS[name];
    setUserCoords(coords);

    // Calculate events near this new location to trigger realistic notification
    const nearbyEvents = events.filter(e => {
      const dist = getDistance(coords.lat, coords.lng, e.gps.lat, e.gps.lng);
      return dist <= 20; // within 20km
    });

    if (nearbyEvents.length > 0) {
      setOnRoadNotification({
        location: name,
        count: nearbyEvents.length,
        category: nearbyEvents[0].category
      });
      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setOnRoadNotification(null);
      }, 6000);
    } else {
      setOnRoadNotification(null);
    }
  };

  // Helper to check if date falls in "Questo Weekend" (Friday, Saturday, Sunday)
  const isThisWeekend = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    return day === 0 || day === 5 || day === 6;
  };

  const getCategoryLabel = (c) => {
    if (c === "Feste di paese") return language === 'en' ? "Country Festivals" : "Feste di paese";
    if (c === "Feste nei locali") return language === 'en' ? "Club Events" : "Feste nei locali";
    if (c === "Musica") return language === 'en' ? "Music" : "Musica";
    if (c === "Motori") return language === 'en' ? "Motors" : "Motori";
    if (c === "Escursioni") return language === 'en' ? "Hiking" : "Escursioni";
    if (c === "Sport") return language === 'en' ? "Sports" : "Sport";
    if (c === "Mercatini") return language === 'en' ? "Markets" : "Mercatini";
    if (c === "Street food") return "Street Food";
    if (c === "Bambini/Famiglie") return language === 'en' ? "Kids/Family" : "Bambini/Famiglie";
    return c;
  };

  // Filter events based on GPS radius and weekend filter
  const filteredEvents = events.filter(e => {
    // Distance check
    const dist = getDistance(userCoords.lat, userCoords.lng, e.gps.lat, e.gps.lng);
    if (dist > radiusFilter) return false;

    // Weekend check
    if (weekendOnly && !isThisWeekend(e.date)) return false;

    return true;
  });

  // Color coding calculation based on event date
  const getMarkerColor = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const eventDate = new Date(dateStr);
    const today = new Date(todayStr);
    
    if (dateStr === todayStr) {
      return 'var(--accent-pink)'; // Red for today
    }
    
    // Check if event is within next 7 days
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= 7) {
      return 'var(--accent-orange)'; // Orange for this week
    }
    
    return 'var(--accent-green)'; // Green for this month
  };

  // Map projection calculations: map lat/lng coordinates to standard SVG coordinates
  // DYNAMIC projection calculation:
  let minLat = 45.3;
  let maxLat = 46.4;
  let minLng = 8.5;
  let maxLng = 9.8;

  const coordsList = [
    { lat: userCoords.lat, lng: userCoords.lng },
    ...events.filter(e => e.gps).map(e => ({ lat: e.gps.lat, lng: e.gps.lng }))
  ];

  if (coordsList.length > 1) {
    const lats = coordsList.map(c => c.lat);
    const lngs = coordsList.map(c => c.lng);
    const rawMinLat = Math.min(...lats);
    const rawMaxLat = Math.max(...lats);
    const rawMinLng = Math.min(...lngs);
    const rawMaxLng = Math.max(...lngs);

    const latSpan = rawMaxLat - rawMinLat;
    const lngSpan = rawMaxLng - rawMinLng;

    // Add padding (e.g. 15% of the span, minimum 0.1 to avoid zero division)
    const latPadding = Math.max(latSpan * 0.15, 0.05);
    const lngPadding = Math.max(lngSpan * 0.15, 0.05);

    minLat = rawMinLat - latPadding;
    maxLat = rawMaxLat + latPadding;
    minLng = rawMinLng - lngPadding;
    maxLng = rawMaxLng + lngPadding;
  }

  const projectCoords = (lat, lng) => {
    // Map to 100% SVG viewport
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Y is inverted in SVG (high lat is top, so subtract from maxLat)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  const userSvgPos = projectCoords(userCoords.lat, userCoords.lng);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* On the Road Notification Banner */}
      {onRoadNotification && (
        <div className="banner" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)', boxShadow: 'var(--shadow-glow)' }}>
          <Compass className="banner-icon" size={20} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {language === 'en' ? "On the Road Radar" : "Mappa On The Road"}
            </h4>
            <p className="banner-text" style={{ marginTop: '2px' }}>
              {language === 'en'
                ? `You entered a new zone! There are ${onRoadNotification.count} active events (e.g. ${getCategoryLabel(onRoadNotification.category)}) near ${onRoadNotification.location}!`
                : `Sei entrato in una nuova zona! Ci sono ${onRoadNotification.count} eventi attivi (es. ${getCategoryLabel(onRoadNotification.category)}) vicino a ${onRoadNotification.location}!`}
            </p>
          </div>
        </div>
      )}

      {/* Map Control Board */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={18} color="var(--accent-primary)" /> {language === 'en' ? "Simulate your GPS position" : "Simula la tua posizione GPS"}
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {Object.keys(LOCATIONS).map(locName => (
            <button
              key={locName}
              className={`tag-pill ${userLocationName === locName ? 'active' : ''}`}
              onClick={() => handleLocationChange(locName)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              📍 {locName}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{language === 'en' ? "GPS Radius" : "Distanza GPS"}</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{radiusFilter} km</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {[10, 25, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  className={`tag-pill ${radiusFilter === val ? 'active' : ''}`}
                  onClick={() => setRadiusFilter(val)}
                  style={{ flex: 1, padding: '6px 0', fontSize: '12px', textAlign: 'center' }}
                >
                  {val}km
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '18px' }}>
            <button
              className={`tag-pill ${weekendOnly ? 'active' : ''}`}
              onClick={() => setWeekendOnly(!weekendOnly)}
              style={{ padding: '8px 16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📅 {language === 'en' ? "This Weekend" : "Questo Weekend"}
            </button>
          </div>
        </div>
      </div>

      {/* Map Board */}
      <div className="map-canvas-container">
        {/* SVG Grid Overlay */}
        <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.03)" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.03)" />
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="rgba(255,255,255,0.03)" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.03)" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="rgba(255,255,255,0.03)" />

          {/* Simple connections / roads representation */}
          <path d="M 10,80 Q 30,65 50,60 T 90,40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <path d="M 50,20 C 60,40 50,60 50,85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

          {/* Radius Overlay around User */}
          <circle 
            cx={userSvgPos.x} 
            cy={userSvgPos.y} 
            r={`${(radiusFilter / 120) * 100}%`} 
            fill="url(#userGlow)" 
            stroke="rgba(59, 130, 246, 0.25)" 
            strokeWidth="1" 
            strokeDasharray="4,4"
          />

          {/* Current location name labels */}
          {Object.entries(LOCATIONS).map(([name, coords]) => {
            const pos = projectCoords(coords.lat, coords.lng);
            return (
              <text
                key={name}
                x={pos.x}
                y={pos.y}
                dy="-12"
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="10"
                fontWeight="500"
              >
                {name}
              </text>
            );
          })}
        </svg>

        {/* User Marker */}
        <div 
          style={{ 
            position: 'absolute', 
            left: userSvgPos.x, 
            top: userSvgPos.y, 
            transform: 'translate(-50%, -50%)', 
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '2px solid white', boxShadow: '0 0 10px #3b82f6', animation: 'fadeIn 1s infinite alternate' }} />
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#60a5fa', background: 'rgba(15,20,36,0.8)', padding: '1px 4px', borderRadius: '4px', marginTop: '2px', border: '1px solid rgba(96,165,250,0.2)' }}>
            {language === 'en' ? "You" : "Tu"}
          </span>
        </div>

        {/* Event Markers */}
        {filteredEvents.map(evt => {
          const pos = projectCoords(evt.gps.lat, evt.gps.lng);
          const color = getMarkerColor(evt.date);
          const isSelected = selectedEvent?.id === evt.id;
          
          return (
            <button
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -100%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: isSelected ? 12 : 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s'
              }}
            >
              <div 
                style={{ 
                  backgroundColor: color, 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: isSelected ? '34px' : '26px', 
                  height: isSelected ? '34px' : '26px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: isSelected ? `0 0 15px ${color}` : 'var(--shadow-sm)',
                  border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: isSelected ? '16px' : '12px', margin: 'auto' }}>
                  {evt.category === 'Street food' ? '🍔' : 
                   evt.category === 'Musica' ? '🎸' : 
                   evt.category === 'Feste di paese' ? '🍲' : 
                   evt.category === 'Feste nei locali' ? '🎉' : 
                   evt.category === 'Escursioni' ? '🥾' : '🎫'}
                </span>
              </div>
              <div style={{ width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${color}` }} />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-pink)' }} />
          <span>{language === 'en' ? "Today" : "Oggi"}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-orange)' }} />
          <span>{language === 'en' ? "This week" : "Questa settimana"}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-green)' }} />
          <span>{language === 'en' ? "This month" : "Questo mese"}</span>
        </div>
      </div>

      {/* Selected Event Mini Card */}
      {selectedEvent ? (
        <div className="glass-card animate-slide-in" style={{ padding: '12px', position: 'relative', display: 'flex', gap: '12px' }}>
          {selectedEvent.poster && (
            <img 
              src={selectedEvent.poster} 
              alt={selectedEvent.title} 
              style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} 
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' style='background:linear-gradient(135deg, %234f46e5 0%, %23ec4899 100%)'><text x='50%' y='50%' fill='white' font-size='12' font-family='sans-serif' text-anchor='middle' dy='.3em'>Eventi App</text></svg>"; }}
            />
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedEvent.title}</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>📍 {selectedEvent.location}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span className="badge-pill badge-category" style={{ fontSize: '10px', padding: '2px 6px' }}>{getCategoryLabel(selectedEvent.category)}</span>
              <button 
                className="btn btn-primary btn-small" 
                onClick={() => onSelectEvent(selectedEvent)}
                style={{ width: 'auto', padding: '4px 10px', fontSize: '11px' }}
              >
                {language === 'en' ? "Details" : "Dettagli"}
              </button>
            </div>
          </div>
          <button 
            onClick={() => setSelectedEvent(null)}
            style={{ position: 'absolute', top: '4px', right: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
          {language === 'en' ? "Select a marker on the map to view the event" : "Seleziona un marcatore sulla mappa per visualizzare l'evento"}
        </div>
      )}
    </div>
  );
}
