import React from 'react';
import { Calendar, MapPin, Heart, Check, Users } from 'lucide-react';
import { db, getDistance } from '../services/db';
import { useLanguage } from '../services/i18n.jsx';

export default function EventCard({ event, user, onSelect, onToggleParticipation }) {
  const { language, t } = useLanguage();
  const users = db.getUsers();
  const organizer = users.find(u => u.id === event.organizerId);
  const isOrganizerPremium = organizer?.premium;

  const isInterested = user && event.interestedUsers?.includes(user.id);
  const isGoing = user && event.goingUsers?.includes(user.id);

  const getCityCoordinates = (city) => {
    if (!city) return null;
    const cleanCity = city.toLowerCase().trim();
    const CITY_COORDINATES = {
      "milano": { lat: 45.4642, lng: 9.1900 },
      "saronno": { lat: 45.6264, lng: 9.0347 },
      "monza": { lat: 45.5845, lng: 9.2740 },
      "sondrio": { lat: 46.2415, lng: 9.6372 },
      "oleggio": { lat: 45.5982, lng: 8.6369 }
    };
    return CITY_COORDINATES[cleanCity] || null;
  };

  const userCoords = user && getCityCoordinates(user.comune);
  const distance = userCoords && event.gps
    ? getDistance(userCoords.lat, userCoords.lng, event.gps.lat, event.gps.lng)
    : null;

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

  return (
    <div 
      className="glass-card animate-slide-in" 
      onClick={() => onSelect(event)}
      style={{ overflow: 'hidden', cursor: 'pointer', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}
    >
      {event.poster && (
        <div style={{ position: 'relative' }}>
          <img 
            src={event.poster} 
            alt={event.title} 
            className="event-poster" 
            onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300' style='background:linear-gradient(135deg, %234f46e5 0%, %23ec4899 100%)'><text x='50%' y='50%' fill='white' font-size='24' font-family='sans-serif' text-anchor='middle' dy='.3em'>Eventi App 🎟️</text></svg>"; }}
          />
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {event.maxCapacity > 0 && (
              <span className="badge-pill" style={{ backgroundColor: event.goingUsers?.length >= event.maxCapacity ? '#ef4444' : 'rgba(16,185,129,0.9)', color: 'white', fontWeight: 'bold' }}>
                {event.goingUsers?.length >= event.maxCapacity ? '🚫 SOLD OUT' : `🎟️ ${event.maxCapacity - event.goingUsers.length} posti`}
              </span>
            )}
            <span className="badge-pill badge-category">{getCategoryLabel(event.category)}</span>
            <span className="badge-pill" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}>
              {event.cost === 'Gratuito' && language === 'en' ? 'Free' : event.cost}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.2' }}>{event.title}</h3>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {language === 'en' ? 'Organized by:' : 'Organizzato da:'} 
          <strong style={{ color: 'var(--text-secondary)' }}>{organizer ? `${organizer.name} ${organizer.cognome}` : 'Organizer'}</strong>
          {isOrganizerPremium && <span className="verified-badge" title="Verificato">✓</span>}
        </p>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} color="var(--accent-primary)" /> {event.date} {language === 'en' ? 'at' : 'alle'} {event.time}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <MapPin size={13} color="var(--accent-pink)" /> 
              <span>{event.location}</span> 
              {distance !== null && <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>({distance.toFixed(1)} {t('distance_from_you')})</span>}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <button 
              className={`btn btn-small ${isInterested ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '6px 10px', 
                backgroundColor: isInterested ? 'var(--accent-pink)' : 'var(--bg-tertiary)',
                boxShadow: isInterested ? 'var(--shadow-glow-pink)' : 'none',
                borderColor: isInterested ? 'var(--accent-pink)' : 'var(--border-glass)'
              }}
              onClick={() => onToggleParticipation(event.id, 'interested')}
            >
              <Heart size={14} fill={isInterested ? 'white' : 'none'} color={isInterested ? 'white' : 'var(--text-secondary)'} />
            </button>

            <button 
              className={`btn btn-small ${isGoing ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '6px 10px', 
                backgroundColor: isGoing ? 'var(--accent-green)' : 'var(--bg-tertiary)',
                boxShadow: isGoing ? 'var(--shadow-glow-green)' : 'none',
                borderColor: isGoing ? 'var(--accent-green)' : 'var(--border-glass)',
                color: isGoing ? 'white' : 'var(--text-secondary)'
              }}
              onClick={() => onToggleParticipation(event.id, 'going')}
            >
              <Check size={14} /> {isGoing ? (language === 'en' ? 'Going' : 'Ci sarò') : (language === 'en' ? 'Join' : 'Partecipa')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> {event.interestedUsers?.length || 0} {language === 'en' ? 'interested' : 'interessati'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {event.goingUsers?.length || 0} {language === 'en' ? 'going' : 'partecipanti'}</span>
        </div>
      </div>
    </div>
  );
}
