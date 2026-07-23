import React, { useState } from 'react';
import { Calendar as CalIcon, MapPin, Clock, ArrowRight, Info, Check, ChevronLeft, ChevronRight, Bookmark, Heart } from 'lucide-react';
import { db } from '../services/db';
import { useLanguage } from '../services/i18n.jsx';

export default function CalendarTab({ user, events = [], onSelectEvent }) {
  const { language, t } = useLanguage();

  // Current view date (default to July 2026 or current real date)
  const today = new Date();
  const initialYear = today.getFullYear() === 2026 ? 2026 : 2026;
  const initialMonth = today.getMonth() === 6 ? 6 : 6; // 0-indexed: 6 = July

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 6 = Luglio 2026
  const [selectedDay, setSelectedDay] = useState(23); // Default 23rd
  const [calendarFilter, setCalendarFilter] = useState('attending'); // 'attending' | 'all' | 'interested'

  const monthNames = language === 'en' 
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const daysOfWeek = language === 'en'
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  // Helper to compute calendar grid for any year/month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOffset = (year, month) => {
    const day = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    return day === 0 ? 6 : day - 1; // 0 = Mon, 6 = Sun
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startDayOffset = getFirstDayOffset(currentYear, currentMonth);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Filter events based on active user filter
  const getFilteredEventsList = () => {
    if (!user) return events;
    if (calendarFilter === 'attending') {
      return events.filter(e => e.goingUsers?.includes(user.id));
    }
    if (calendarFilter === 'interested') {
      return events.filter(e => e.interestedUsers?.includes(user.id) || e.savedUsers?.includes(user.id));
    }
    return events; // 'all'
  };

  const filteredEvents = getFilteredEventsList();

  // Helper to get events on a specific day for the active month & year
  const getEventsOnDay = (dayNumber) => {
    const monthStr = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dayStr = dayNumber < 10 ? `0${dayNumber}` : `${dayNumber}`;
    const dateQuery = `${currentYear}-${monthStr}-${dayStr}`;
    return filteredEvents.filter(e => e.date === dateQuery);
  };

  const hasEventsOnDay = (dayNumber) => {
    return getEventsOnDay(dayNumber).length > 0;
  };

  // Build grid cells
  const calendarCells = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push(null);
  }
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
        <CalIcon color="var(--accent-primary)" /> {t('calendar')}
      </h2>

      {/* Filter Selector Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px' }}>
        <button
          type="button"
          onClick={() => setCalendarFilter('attending')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: calendarFilter === 'attending' ? 'var(--gradient-primary)' : 'transparent',
            color: calendarFilter === 'attending' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Check size={13} /> {language === 'en' ? "Going" : "Ci sarò"}
        </button>

        <button
          type="button"
          onClick={() => setCalendarFilter('interested')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: calendarFilter === 'interested' ? 'var(--gradient-primary)' : 'transparent',
            color: calendarFilter === 'interested' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <Heart size={13} /> {language === 'en' ? "Interested" : "Interessato/Salvati"}
        </button>

        <button
          type="button"
          onClick={() => setCalendarFilter('all')}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: calendarFilter === 'all' ? 'var(--gradient-primary)' : 'transparent',
            color: calendarFilter === 'all' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <CalIcon size={13} /> {language === 'en' ? "All Events" : "Tutti gli Eventi"}
        </button>
      </div>

      {/* Dynamic Month Selector Header & Grid Box */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <button 
            type="button"
            onClick={handlePrevMonth}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>
            {monthNames[currentMonth]} {currentYear}
          </h3>

          <button 
            type="button"
            onClick={handleNextMonth}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            <ChevronRight size={18} />
          </button>
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

            const active = hasEventsOnDay(day);
            const isSelected = selectedDay === day;

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
                    ? 'rgba(79, 70, 229, 0.2)' 
                    : isSelected 
                      ? 'var(--bg-tertiary)' 
                      : 'transparent',
                  color: active 
                    ? 'var(--accent-primary)' 
                    : isSelected 
                      ? 'var(--text-primary)' 
                      : 'var(--text-secondary)',
                  fontWeight: active || isSelected ? 'bold' : 'normal',
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
                  <span style={{ position: 'absolute', bottom: '3px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda view */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
          {language === 'en' ? `Agenda for ${selectedDay} ${monthNames[currentMonth]} ${currentYear}` : `Agenda del ${selectedDay} ${monthNames[currentMonth]} ${currentYear}`}
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
                      <Check size={12} /> {language === 'en' ? "Details" : "Vedi Dettagli"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
            {language === 'en' ? "No events scheduled for this day." : "Nessun evento in programma per questo giorno."}
          </p>
        )}
      </div>

      {/* Full List Timeline */}
      <div>
        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
          {calendarFilter === 'attending' 
            ? (language === 'en' ? `Events I'm Attending (${filteredEvents.length})` : `I miei impegni (${filteredEvents.length})`)
            : calendarFilter === 'interested'
              ? (language === 'en' ? `Interested / Saved Events (${filteredEvents.length})` : `Eventi d'interesse / Salvati (${filteredEvents.length})`)
              : (language === 'en' ? `All Available Events (${filteredEvents.length})` : `Tutti gli eventi disponibili (${filteredEvents.length})`)}
        </h3>
        
        {filteredEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredEvents.map(evt => (
              <div 
                key={evt.id} 
                className="glass-card"
                onClick={() => onSelectEvent(evt)}
                style={{ padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{evt.title}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    📅 {evt.date} {language === 'en' ? "at" : "alle"} {evt.time} - {evt.location.split(',')[0]}
                  </p>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Info size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.6 }} />
            {calendarFilter === 'attending' 
              ? (language === 'en' ? "You haven't joined any events yet. Click 'Going' on any event card to add it to your calendar!" : "Non ti sei ancora iscritto a nessun evento. Clicca su 'Ci sarò' nella scheda esplora per aggiungerlo direttamente qui!")
              : (language === 'en' ? "No events found for this filter." : "Nessun evento trovato per questo filtro.")}
          </div>
        )}
      </div>

    </div>
  );
}
