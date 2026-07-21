import React, { useState } from 'react';
import { Calendar as CalIcon, MapPin, Clock, ArrowRight, Info, Check } from 'lucide-react';
import { db } from '../services/db';

export default function CalendarTab({ user, events, onSelectEvent }) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Filter events where user is attending ("Ci sarò")
  const attendingEvents = events.filter(e => e.goingUsers?.includes(user.id));

  // Calendar parameters for June 2026
  // June 2026 starts on a Monday (1) and has 30 days.
  const daysInMonth = 30;
  const startDayOffset = 0; // Monday is the 1st day of the week, so 0 offset if Mon=0

  const monthName = "Giugno 2026";
  const daysOfWeek = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  // Helper to get events on a specific day of June 2026
  const getEventsOnDay = (dayNumber) => {
    const dayStr = dayNumber < 10 ? `0${dayNumber}` : `${dayNumber}`;
    const dateQuery = `2026-06-${dayStr}`;
    return attendingEvents.filter(e => e.date === dateQuery);
  };

  // Helper to check if any event on this day is active
  const hasEvents = (dayNumber) => {
    return getEventsOnDay(dayNumber).length > 0;
  };

  // Generate calendar grid array
  const calendarCells = [];
  // Empty slots for offset
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const selectedDayEvents = getEventsOnDay(selectedDay);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90' style='background:linear-gradient(135deg, %234f46e5 0%, %23ec4899 100%)'><text x='50%' y='50%' fill='white' font-size='12' font-family='sans-serif' text-anchor='middle' dy='.3em'>Eventi App</text></svg>";
  };

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '30px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalIcon color="var(--accent-primary)" /> Il Mio Calendario
      </h2>

      {/* Calendar Grid Box */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>
          {monthName}
        </div>

        {/* Days of week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '4px', marginBottom: '8px' }}>
          {daysOfWeek.map(d => (
            <span key={d} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{d}</span>
          ))}
        </div>

        {/* Calendar days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const active = hasEvents(day);
            const isSelected = selectedDay === day;
            const isToday = day === new Date().getDate();

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => setSelectedDay(day)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid transparent',
                  background: active 
                    ? 'rgba(79, 70, 229, 0.15)' 
                    : isToday 
                      ? 'var(--bg-tertiary)' 
                      : 'transparent',
                  color: active 
                    ? 'var(--accent-primary)' 
                    : isSelected 
                      ? 'var(--text-primary)' 
                      : 'var(--text-secondary)',
                  fontWeight: active || isSelected || isToday ? 'bold' : 'normal',
                  fontSize: '13px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {day}
                {active && (
                  <span style={{ position: 'absolute', bottom: '3px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda view */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
          Agenda del {selectedDay} Giugno 2026
        </h3>
        
        {selectedDayEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedDayEvents.map(evt => (
              <div 
                key={evt.id} 
                className="glass-card animate-slide-in"
                onClick={() => onSelectEvent(evt)}
                style={{ padding: '12px', cursor: 'pointer', display: 'flex', gap: '12px' }}
              >
                {evt.poster && (
                  <img 
                    src={evt.poster} 
                    alt={evt.title} 
                    onError={handleImageError}
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} 
                  />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{evt.title}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} /> {evt.time}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={11} /> {evt.location.split(',')[0]}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Check size={12} /> Iscritto
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
            Nessun evento in programma per questo giorno.
          </p>
        )}
      </div>

      {/* Full Attendee List Timeline */}
      <div>
        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
          Tutti i miei impegni ({attendingEvents.length})
        </h3>
        
        {attendingEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {attendingEvents.map(evt => (
              <div 
                key={evt.id} 
                className="glass-card"
                onClick={() => onSelectEvent(evt)}
                style={{ padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{evt.title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    📅 {evt.date} alle {evt.time} - {evt.location.split(',')[0]}
                  </p>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Info size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.6 }} />
            Non ti sei ancora iscritto a nessun evento. Clicca su "Ci sarò" nella scheda esplora per aggiungerlo direttamente qui!
          </div>
        )}
      </div>

    </div>
  );
}
