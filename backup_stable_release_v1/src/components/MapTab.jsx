import React, { useState, useEffect, useRef } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { db, getDistance } from '../services/db';
import { useLanguage } from '../services/i18n.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const [onRoadNotification, setOnRoadNotification] = useState(null);
  const [searchCityQuery, setSearchCityQuery] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroupRef = useRef(null);
  const radiusCircleRef = useRef(null);

  // Initialize user position from profile once on mount
  useEffect(() => {
    // Check if real GPS was saved in session
    const savedGps = sessionStorage.getItem('evt_real_gps');
    if (savedGps) {
      try {
        const parsed = JSON.parse(savedGps);
        setUserCoords(parsed.coords);
        setUserLocationName(parsed.name);
        return;
      } catch (e) {}
    }
    
    if (user && user.comune && LOCATIONS[user.comune]) {
      setUserLocationName(user.comune);
      setUserCoords(LOCATIONS[user.comune]);
    }
  }, []);

  // Leaflet map initialization
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Create map instance with full interactive controls
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        dragging: true,
        doubleClickZoom: true
      }).setView([userCoords.lat, userCoords.lng], 10);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Layer groups for markers and accuracy circle
      markersGroupRef.current = L.layerGroup().addTo(mapInstance.current);

      // Invalidate size to ensure container touch bounds are calculated
      setTimeout(() => {
        if (mapInstance.current) mapInstance.current.invalidateSize();
      }, 200);
    }

    return () => {
      // Destroy map instance on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map viewport ONLY when user selects a new location or detects GPS
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([userCoords.lat, userCoords.lng], 10, { duration: 1.2 });
    }
  }, [userCoords]);

  // Render markers and radius circle dynamically without snapping view
  useEffect(() => {
    if (mapInstance.current) {
      // Clear old layers
      if (markersGroupRef.current) {
        markersGroupRef.current.clearLayers();
      }
      if (radiusCircleRef.current) {
        mapInstance.current.removeLayer(radiusCircleRef.current);
      }

      // Add new radius indicator circle
      radiusCircleRef.current = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusFilter * 1000, // convert km to meters
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(mapInstance.current);

      // 1. User Position Marker
      const userMarkerHtml = `<div style="background-color: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.6); display: flex; align-items: center; justify-content: center; font-size: 11px;">👤</div>`;
      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: 'custom-leaflet-user-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(markersGroupRef.current)
        .bindPopup(`<strong>${language === 'en' ? "Your position" : "La tua posizione"}</strong>`);

      // 2. Event Markers
      filteredEvents.forEach(evt => {
        if (evt.gps) {
          const color = getMarkerColor(evt.date);
          const emoji = evt.category === 'Street food' ? '🍔' : 
                        evt.category === 'Musica' ? '🎸' : 
                        evt.category === 'Feste di paese' ? '🍲' : 
                        evt.category === 'Feste nei locali' ? '🎉' : 
                        evt.category === 'Escursioni' ? '🥾' : '🎫';
                        
          const eventMarkerHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
              <div style="background-color: ${color}; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.3); border: 2px solid white; transition: all 0.2s;">
                <span style="font-size: 14px;">${emoji}</span>
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color}; margin-top: -1px;"></div>
            </div>
          `;

          const eventIcon = L.divIcon({
            html: eventMarkerHtml,
            className: 'custom-leaflet-event-marker',
            iconSize: [28, 34],
            iconAnchor: [14, 34],
            popupAnchor: [0, -30]
          });

          // Create Popup Container Element programmatically to prevent React scoping issues
          const popupDiv = document.createElement('div');
          popupDiv.style.textAlign = 'center';
          popupDiv.style.minWidth = '130px';
          popupDiv.innerHTML = `
            <div style="font-family: inherit; font-size: 12px; margin: 4px 0;">
              <strong style="color: #0b0f19; font-size: 13px;">${evt.title}</strong>
              <p style="margin: 4px 0; color: #4b5563;">${evt.location}</p>
              <button id="btn-popup-${evt.id}" style="background: linear-gradient(135deg, #ff385c 0%, #e11d48 50%, #f97316 100%); border: none; color: white; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; width: 100%; transition: transform 0.2s;">
                ${t('explore')}
              </button>
            </div>
          `;

          const marker = L.marker([evt.gps.lat, evt.gps.lng], { icon: eventIcon })
            .addTo(markersGroupRef.current);
            
          marker.bindPopup(popupDiv);

          // Hook popup open to bind button click handler
          marker.on('popupopen', () => {
            const btn = document.getElementById(`btn-popup-${evt.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectEvent(evt);
              };
            }
          });
        }
      });
    }
  }, [userCoords, radiusFilter, weekendOnly, events, language]);

  const handleLocationChange = (name) => {
    setUserLocationName(name);
    const coords = LOCATIONS[name];
    setUserCoords(coords);

    const nearbyEvents = events.filter(e => {
      if (!e.gps) return false;
      const dist = getDistance(coords.lat, coords.lng, e.gps.lat, e.gps.lng);
      return dist <= 20;
    });

    if (nearbyEvents.length > 0) {
      setOnRoadNotification({
        location: name,
        count: nearbyEvents.length,
        category: nearbyEvents[0].category
      });
      setTimeout(() => {
        setOnRoadNotification(null);
      }, 6000);
    } else {
      setOnRoadNotification(null);
    }
  };

  const handleSearchCitySubmit = async (query) => {
    if (!query || query.trim().length < 2) return;
    setIsSearchingCity(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=it&q=${encodeURIComponent(query.trim())}&limit=1`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        const cityName = data[0].display_name.split(',')[0];
        setUserLocationName(cityName);
        setUserCoords(coords);

        const nearbyEvents = events.filter(e => {
          if (!e.gps) return false;
          const dist = getDistance(coords.lat, coords.lng, e.gps.lat, e.gps.lng);
          return dist <= radiusFilter;
        });

        if (nearbyEvents.length > 0) {
          setOnRoadNotification({
            location: cityName,
            count: nearbyEvents.length,
            category: nearbyEvents[0].category
          });
          setTimeout(() => setOnRoadNotification(null), 6000);
        }
      } else {
        alert(language === 'en' ? "City not found. Try searching another town name." : "Città non trovata. Prova a cercare un altro comune.");
      }
    } catch (e) {
      console.error("City search error:", e);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleDetectRealLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: parseFloat(position.coords.latitude.toFixed(4)),
            lng: parseFloat(position.coords.longitude.toFixed(4))
          };
          const locName = language === 'en' ? "My GPS Coordinates" : "Tua Posizione GPS";
          setUserCoords(coords);
          setUserLocationName(locName);

          // Save to session so tab switches do not reset position
          try {
            sessionStorage.setItem('evt_real_gps', JSON.stringify({ coords, name: locName }));
          } catch (e) {}
          
          const nearbyEvents = events.filter(e => {
            if (!e.gps) return false;
            const dist = getDistance(coords.lat, coords.lng, e.gps.lat, e.gps.lng);
            return dist <= 20;
          });

          if (nearbyEvents.length > 0) {
            setOnRoadNotification({
              location: language === 'en' ? "current location" : "tua posizione attuale",
              count: nearbyEvents.length,
              category: nearbyEvents[0].category
            });
            setTimeout(() => setOnRoadNotification(null), 6000);
          }
        },
        (error) => {
          alert(language === 'en' ? "Could not access GPS location. Make sure GPS permissions are enabled." : "Impossibile accedere alla geolocalizzazione GPS. Assicurati che i permessi del browser siano attivi.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      alert(language === 'en' ? "Geolocation is not supported by your browser." : "La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const isThisWeekend = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
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

  const filteredEvents = events.filter(e => {
    if (!e.gps) return false;
    const dist = getDistance(userCoords.lat, userCoords.lng, e.gps.lat, e.gps.lng);
    if (dist > radiusFilter) return false;
    if (weekendOnly && !isThisWeekend(e.date)) return false;
    return true;
  });

  const getMarkerColor = (dateStr) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const eventDate = new Date(dateStr);
    const today = new Date(todayStr);
    
    if (dateStr === todayStr) {
      return '#f43f5e'; // Red
    }
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= 7) {
      return '#f97316'; // Orange
    }
    return '#10b981'; // Green
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <MapPin size={18} color="var(--accent-primary)" /> {language === 'en' ? "Your GPS Location:" : "La tua posizione:"}&nbsp;<span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>{userLocationName}</span>
          </h3>
          <button
            onClick={handleDetectRealLocation}
            className="btn btn-small"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--gradient-premium)' }}
          >
            🛰️ {language === 'en' ? "Detect Real GPS" : "Rileva Posizione GPS"}
          </button>
        </div>
        
        {/* Dynamic City Search Bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder={language === 'en' ? "🔍 Search any city or municipality in Italy..." : "🔍 Cerca qualsiasi città o comune in Italia..."}
              value={searchCityQuery}
              onChange={(e) => setSearchCityQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCitySubmit(searchCityQuery)}
              style={{ fontSize: '13px', flex: 1 }}
            />
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSearchCitySubmit(searchCityQuery)}
              disabled={isSearchingCity}
              style={{ width: 'auto', padding: '0 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {isSearchingCity ? '...' : (language === 'en' ? "Search" : "Cerca")}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '2px' }}>
              {language === 'en' ? "Popular:" : "Città popolari:"}
            </span>
            {["Milano", "Saronno", "Monza", "Bergamo", "Oleggio", "Sondrio", "Roma", "Torino"].map(locName => (
              <button
                key={locName}
                type="button"
                className={`tag-pill ${userLocationName === locName ? 'active' : ''}`}
                onClick={() => {
                  setSearchCityQuery(locName);
                  if (LOCATIONS[locName]) {
                    handleLocationChange(locName);
                  } else {
                    handleSearchCitySubmit(locName);
                  }
                }}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                📍 {locName}
              </button>
            ))}
          </div>
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
      <div ref={mapRef} className="map-canvas-container" style={{ border: '1px solid var(--border-glass)', height: '380px' }}></div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
          <span>{language === 'en' ? "Today" : "Oggi"}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316' }} />
          <span>{language === 'en' ? "This week" : "Questa settimana"}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>{language === 'en' ? "This month" : "Questo mese"}</span>
        </div>
      </div>

    </div>
  );
}
