import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Heart, Check, Bookmark, ArrowLeft, Shield, Map, ExternalLink, CalendarPlus, MessageSquare, Info, ShieldAlert, Plus, ChevronLeft, ChevronRight, X, Image as ImageIcon, User, Share2, QrCode, Ticket, Copy, CheckCircle2, Trash2 } from 'lucide-react';
import { db, getDistance } from '../services/db';
import { useLanguage } from '../services/i18n.jsx';
import { fetchLiveWeather } from '../services/weather';

const PHOTO_PRESETS = [
  { name: "🍔 Street Food", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800" },
  { name: "🎸 Concerto Rock", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800" },
  { name: "🍲 Sagra Tradizionale", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800" },
  { name: "🏞️ Escursione Natura", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800" }
];

export default function EventDetails({ event, user, onBack, onToggleParticipation, onStartChat, onProfileUpdated, onRefreshEvents }) {
  const { language, t } = useLanguage();
  const [showDirectionsMenu, setShowDirectionsMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Share & Ticket Modals states
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [liveWeatherData, setLiveWeatherData] = useState(null);

  // Social board & photo likes states
  const [communityMessages, setCommunityMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [galleryUpdateCounter, setGalleryUpdateCounter] = useState(0);

  // Edit Event States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDesc, setEditDesc] = useState(event.desc);
  const [editDate, setEditDate] = useState(event.date);
  const [editTime, setEditTime] = useState(event.time);
  const [editLocation, setEditLocation] = useState(event.location);
  const [editLat, setEditLat] = useState(event.gps?.lat?.toString() || '45.4642');
  const [editLng, setEditLng] = useState(event.gps?.lng?.toString() || '9.1900');
  const [editCategory, setEditCategory] = useState(event.category);
  const [editCost, setEditCost] = useState(event.cost);
  const [editMaxCapacity, setEditMaxCapacity] = useState(event.maxCapacity?.toString() || '150');
  const [editTicketUrl, setEditTicketUrl] = useState(event.ticketUrl || '');
  const [editAccessibili, setEditAccessibili] = useState(event.accessibili ?? true);
  const [editAnimali, setEditAnimali] = useState(event.animali ?? true);
  const [editParcheggio, setEditParcheggio] = useState(event.parcheggio ?? true);
  const [editPoster, setEditPoster] = useState(event.poster || '');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Sync edit states on event change
  useEffect(() => {
    setEditTitle(event.title);
    setEditDesc(event.desc);
    setEditDate(event.date);
    setEditTime(event.time);
    setEditLocation(event.location);
    setEditLat(event.gps?.lat?.toString() || '45.4642');
    setEditLng(event.gps?.lng?.toString() || '9.1900');
    setEditCategory(event.category);
    setEditCost(event.cost);
    setEditMaxCapacity(event.maxCapacity?.toString() || '150');
    setEditTicketUrl(event.ticketUrl || '');
    setEditAccessibili(event.accessibili ?? true);
    setEditAnimali(event.animali ?? true);
    setEditParcheggio(event.parcheggio ?? true);
    setEditPoster(event.poster || '');
    setEditError('');
    setEditSuccess('');
  }, [event]);

  // Geocoding on edit address
  const handleEditGeocode = async (address) => {
    if (!address || address.trim().length < 2) return null;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=it&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const latStr = parseFloat(data[0].lat).toFixed(4);
        const lngStr = parseFloat(data[0].lon).toFixed(4);
        setEditLat(latStr);
        setEditLng(lngStr);
        return { lat: latStr, lng: lngStr };
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    }
    return null;
  };

  // Save changes handler
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!editTitle || !editDesc || !editDate || !editTime || !editLocation) {
      setEditError("Per favore, compila tutti i campi fondamentali.");
      return;
    }

    let currentLat = editLat;
    let currentLng = editLng;
    const geoRes = await handleEditGeocode(editLocation);
    if (geoRes) {
      currentLat = geoRes.lat;
      currentLng = geoRes.lng;
    }

    // Proximity alert: check if there's already any event within 30 km on the same day (excluding itself)
    const sameDayEvents = db.getEvents().filter(evt => evt.date === editDate && evt.id !== event.id);
    const nearbyConflict = sameDayEvents.find(evt => {
      const dist = getDistance(parseFloat(currentLat), parseFloat(currentLng), evt.gps.lat, evt.gps.lng);
      return dist <= 30;
    });

    if (nearbyConflict) {
      const dist = getDistance(parseFloat(editLat), parseFloat(editLng), nearbyConflict.gps.lat, nearbyConflict.gps.lng).toFixed(1);
      alert(`Attenzione: c'è già un altro evento programmato per questa data entro 30 km di distanza!\n\nEvento: "${nearbyConflict.title}" a ${nearbyConflict.location} (${dist} km di distanza)`);
    }

    const updatedFields = {
      title: editTitle,
      desc: editDesc,
      date: editDate,
      time: editTime,
      location: editLocation,
      gps: { lat: parseFloat(editLat), lng: parseFloat(editLng) },
      category: editCategory,
      cost: editCost,
      maxCapacity: parseInt(editMaxCapacity) || 0,
      ticketUrl: editTicketUrl.trim(),
      accessibili: editAccessibili,
      animali: editAnimali,
      parcheggio: editParcheggio,
      poster: editPoster
    };

    const res = db.editEvent(event.id, updatedFields, user.id);
    if (res.success) {
      setEditSuccess("Evento aggiornato con successo!");
      Object.assign(event, res.event); // update details display in-place
      setTimeout(() => {
        setShowEditModal(false);
        if (onRefreshEvents) onRefreshEvents();
      }, 1000);
    } else {
      setEditError(res.message);
    }
  };

  // Delete event handler
  const handleDeleteEvent = () => {
    const proceed = window.confirm("Sei sicuro di voler eliminare definitivamente questo evento? Questa azione è irreversibile.");
    if (!proceed) return;

    const res = db.deleteEvent(event.id, user.id);
    if (res.success) {
      alert("Evento eliminato con successo.");
      setShowEditModal(false);
      if (onRefreshEvents) onRefreshEvents();
      onBack();
    } else {
      alert(res.message);
    }
  };

  useEffect(() => {
    const loadCommunityData = () => {
      db.syncCloudCommunityMessages();
      setCommunityMessages(db.getCommunityMessages(event.id));
    };

    loadCommunityData();

    // Auto-refresh polling every 1.5 seconds with cloud sync
    const interval = setInterval(loadCommunityData, 1500);

    const handleSync = () => {
      setCommunityMessages(db.getCommunityMessages(event.id));
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('evt_community_updated', handleSync);

    if (event.gps) {
      fetchLiveWeather(event.gps.lat, event.gps.lng).then(data => setLiveWeatherData(data));
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('evt_community_updated', handleSync);
    };
  }, [event.id, event.gps]);

  const users = db.getUsers();
  const organizer = users.find(u => u.id === event.organizerId);
  const isOrganizerPremium = organizer?.premium;

  const isInterested = user && event.interestedUsers?.includes(user.id);
  const isGoing = user && event.goingUsers?.includes(user.id);
  const isSaved = user && event.savedUsers?.includes(user.id);

  const canEdit = user && (
    event.organizerId === user.id || 
    (user.role === 'collaboratore' && event.organizerId === user.invitedBy)
  );

  // Generate calendar export links
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.desc);
    const location = encodeURIComponent(event.location);
    
    const dateFormatted = event.date.replace(/-/g, '');
    const startTime = event.time.replace(/:/g, '') + '00';
    const endTime = (parseInt(event.time.split(':')[0]) + 2) + event.time.split(':')[1] + '00';
    const dates = `${dateFormatted}T${startTime}/${dateFormatted}T${endTime}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = () => {
    const title = event.title;
    const desc = event.desc.replace(/\n/g, '\\n');
    const location = event.location;
    const dateFormatted = event.date.replace(/-/g, '');
    const startTime = event.time.replace(/:/g, '') + '00';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${desc}
LOCATION:${location}
DTSTART:${dateFormatted}T${startTime}
DTEND:${dateFormatted}T${(parseInt(event.time.split(':')[0]) + 2) + event.time.split(':')[1]}00
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open maps coordinates & full address navigation
  const openDirections = (app) => {
    const fullLoc = event.location || '';
    const hasGps = event.gps && event.gps.lat && event.gps.lng;
    const navQuery = fullLoc.trim() ? encodeURIComponent(fullLoc) : (hasGps ? `${event.gps.lat},${event.gps.lng}` : '');
    const gpsCoords = hasGps ? `${event.gps.lat},${event.gps.lng}` : '';

    let url = '';
    if (app === 'google') {
      url = `https://www.google.com/maps/dir/?api=1&destination=${navQuery}`;
    } else if (app === 'apple') {
      url = `maps://maps.apple.com/?daddr=${navQuery}`;
    } else if (app === 'waze') {
      url = gpsCoords 
        ? `https://waze.com/ul?ll=${gpsCoords}&navigate=yes&q=${navQuery}`
        : `https://waze.com/ul?q=${navQuery}&navigate=yes`;
    }
    window.open(url, '_blank');
    setShowDirectionsMenu(false);
  };

  const handleAddPhotoSubmit = (e, presetUrl = null) => {
    if (e) e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    const url = presetUrl || uploadUrl.trim();
    if (!url) {
      setUploadError("Fornisci un URL immagine valido.");
      return;
    }

    const uploaderId = user ? user.id : 'org_1';
    const uploaderName = user ? `${user.name} ${user.cognome}` : 'Organizzatore';

    const res = db.addPhotoToEvent(event.id, url, uploaderId, uploaderName);
    if (res.success) {
      setUploadSuccess("Foto aggiunta con successo!");
      setUploadUrl('');
      
      // Update local event references
      event.gallery = res.event.gallery;
      setGalleryUpdateCounter(prev => prev + 1);
      
      setTimeout(() => {
        setUploadSuccess('');
        setShowUploadForm(false);
      }, 1000);
    } else {
      setUploadError("Errore durante l'aggiunta della foto.");
    }
  };

  const handleToggleLike = (e, photoId) => {
    e.stopPropagation(); // prevent lightbox slider
    if (!user) return;

    const res = db.togglePhotoLike(event.id, photoId, user.id);
    if (res.success) {
      event.gallery = res.event.gallery;
      setGalleryUpdateCounter(prev => prev + 1);

      // If XP was awarded to uploader and it's not the user liking their own photo, write alert in uploader's notifications
      if (res.xpAwarded > 0 && res.uploaderId && res.uploaderId !== user.id) {
        const uploaderNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${res.uploaderId}`) || "[]");
        uploaderNotifs.unshift({
          id: `notif_like_${Date.now()}`,
          title: "Il tuo scatto piace a qualcuno! ❤️",
          text: `${user.name} ha messo like alla tua foto. Hai guadagnato +5 XP!`,
          timestamp: new Date().toISOString(),
          type: "system",
          read: false
        });
        localStorage.setItem(`evt_notifications_${res.uploaderId}`, JSON.stringify(uploaderNotifs));
      }
    }
  };

  const handlePostCommunityMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user) return;

    const res = db.addCommunityMessage(
      event.id,
      user.id,
      `${user.name} ${user.cognome}`,
      user.avatar || '',
      newMessageText.trim()
    );

    if (res.success) {
      setCommunityMessages(db.getCommunityMessages(event.id));
      setNewMessageText('');

      // Trigger user points sync in App.jsx
      const updatedUser = { ...user, points: res.userPoints };
      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
        localStorage.setItem("evt_current_user", JSON.stringify(updatedUser));
      }

      // Add a local notification for contributing to the community board
      const myNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${user.id}`) || "[]");
      myNotifs.unshift({
        id: `notif_contrib_${Date.now()}`,
        title: "Contributo Community! 👥",
        text: `Grazie per aver partecipato alla bacheca. Hai ottenuto +2 XP!`,
        timestamp: new Date().toISOString(),
        type: "system",
        read: false
      });
      localStorage.setItem(`evt_notifications_${user.id}`, JSON.stringify(myNotifs));
    }
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

  return (
    <div className="view-content animate-slide-in" style={{ padding: '0 0 40px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)', sticky: 'top', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={24} />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{language === 'en' ? "Event Details" : "Dettaglio Evento"}</span>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowEditModal(true)}
            className="btn btn-secondary btn-small"
            style={{ width: 'auto', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            ✏️ {language === 'en' ? "Edit Event" : "Modifica Evento"}
          </button>
        )}
      </div>

      {/* Main Poster */}
      {event.poster && (
        <div style={{ width: '100%', height: '240px', position: 'relative' }}>
          <img 
            src={event.poster} 
            alt={event.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300' style='background:linear-gradient(135deg, %234f46e5 0%, %23ec4899 100%)'><text x='50%' y='50%' fill='white' font-size='24' font-family='sans-serif' text-anchor='middle' dy='.3em'>Eventi App 🎟️</text></svg>"; }}
          />
          <div style={{ position: 'absolute', bottom: '16px', left: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {event.maxCapacity > 0 && (
              <span className="badge-pill" style={{ backgroundColor: event.goingUsers?.length >= event.maxCapacity ? '#ef4444' : 'rgba(16,185,129,0.9)', color: 'white', fontWeight: 'bold' }}>
                {event.goingUsers?.length >= event.maxCapacity ? '🚫 SOLD OUT' : `🎟️ Posti: ${event.goingUsers?.length || 0} / ${event.maxCapacity}`}
              </span>
            )}
            <span className="badge-pill badge-category">{getCategoryLabel(event.category)}</span>
            <span className="badge-pill" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}>
              {event.cost === 'Gratuito' && language === 'en' ? 'Free' : event.cost}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Title & Stats */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>{event.title}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'Organized by:' : 'Organizzato da:'} <strong>{organizer ? `${organizer.name} ${organizer.cognome}` : (language === 'en' ? 'Organizer' : 'Organizzatore')}</strong>
              {isOrganizerPremium && <span className="verified-badge" title={language === 'en' ? "Certified Organizer" : "Organizzatore Certificato"}>✓</span>}
            </p>
          </div>
        </div>

        {/* Date, Time, Location details */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <Calendar size={20} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{language === 'en' ? "Date and Time" : "Data e Ora"}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{event.date} {language === 'en' ? 'at' : 'alle'} {event.time}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '8px', borderRadius: '8px', color: 'var(--accent-pink)' }}>
              <MapPin size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{language === 'en' ? "Location" : "Luogo"}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{event.location}</p>
            </div>
          </div>

          {/* Enhanced Weather Widget */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '8px', borderRadius: '12px', color: 'white', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)' }}>
                {liveWeatherData ? liveWeatherData.icon : (event.category === 'Escursioni' || event.category === 'Feste di paese' ? '☀️' : '⛅')}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {t('weather_forecast')} 
                  <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-orange)', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    {liveWeatherData?.isLive ? 'Live API 🌤️' : 'Meteo Stimato 🌤️'}
                  </span>
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {liveWeatherData ? (
                    `${liveWeatherData.icon} ${language === 'en' ? liveWeatherData.descEn : liveWeatherData.descIt}, ${liveWeatherData.temp} • ${language === 'en' ? 'Wind' : 'Vento'} ${liveWeatherData.wind} • ${language === 'en' ? 'Rain' : 'Pioggia'} ${liveWeatherData.rainProb}`
                  ) : (
                    event.category === 'Escursioni' 
                      ? (language === 'en' ? '☀️ Sunny, 22°C • Humidity 40% • Rain risk 5%' : '☀️ Soleggiato, 22°C • Umidità 40% • Rischio pioggia 5%') : 
                     (language === 'en' ? '☀️ Clear Sky, 24°C • Humidity 35% • Wind 8 km/h' : '☀️ Sereno, 24°C • Umidità 35% • Vento 8 km/h')
                  )}
                </p>
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: 'var(--accent-green)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✅</span>
              <span>
                {language === 'en' 
                  ? "Great outdoor conditions guaranteed for this event date!" 
                  : "Ottime condizioni all'aperto garantite per la data dell'evento!"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Participation Bar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary"
            style={{ flex: 1, backgroundColor: isInterested ? 'rgba(244,63,94,0.1)' : 'var(--bg-tertiary)', borderColor: isInterested ? 'var(--accent-pink)' : 'var(--border-glass)', color: isInterested ? 'var(--accent-pink)' : 'var(--text-primary)' }}
            onClick={() => onToggleParticipation(event.id, 'interested')}
          >
            <Heart size={16} fill={isInterested ? 'var(--accent-pink)' : 'none'} />
            <span>{isInterested ? (language === 'en' ? 'Interested' : 'Mi interessa') : (language === 'en' ? 'Interested' : 'Mi interessa')}</span>
          </button>

          <button 
            className="btn"
            style={{ flex: 1.2, backgroundColor: isGoing ? 'var(--accent-green)' : 'var(--accent-primary)', color: 'white', boxShadow: isGoing ? 'var(--shadow-glow-green)' : 'none' }}
            onClick={() => onToggleParticipation(event.id, 'going')}
          >
            <Check size={16} />
            <span>{isGoing ? (language === 'en' ? 'Going ✓' : 'Ci sarò ✓') : (language === 'en' ? 'Join Event' : 'Partecipò')}</span>
          </button>

          <button 
            className="btn btn-secondary"
            style={{ flex: 0.5, backgroundColor: isSaved ? 'rgba(245,158,11,0.1)' : 'var(--bg-tertiary)', borderColor: isSaved ? 'var(--accent-orange)' : 'var(--border-glass)', color: isSaved ? 'var(--accent-orange)' : 'var(--text-primary)' }}
            onClick={() => onToggleParticipation(event.id, 'saved')}
          >
            <Bookmark size={16} fill={isSaved ? 'var(--accent-orange)' : 'none'} />
          </button>
        </div>

        {/* Official Ticket Purchasing Link if specified by organizer */}
        {event.ticketUrl && (
          <a 
            href={event.ticketUrl.startsWith('http') ? event.ticketUrl : `https://${event.ticketUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}
          >
            <ExternalLink size={18} />
            <span>{language === 'en' ? "Buy Official Tickets Online 🎟️" : "Acquista Biglietti Ufficiali Online 🎟️"}</span>
          </a>
        )}

        {/* Digital Ticket Pass Button when user is going */}
        {isGoing && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowTicketModal(true)}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--gradient-premium)', color: 'white' }}
          >
            <Ticket size={18} />
            <span>{language === 'en' ? "Show Pass / Entrance QR Code 🎟️" : "Mostra Pass / QR Code d'Ingresso 🎟️"}</span>
          </button>
        )}

        {/* Share Event & QR Code Button */}
        <button 
          className="btn btn-secondary"
          onClick={() => setShowShareModal(true)}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Share2 size={18} color="var(--accent-primary)" />
          <span>{language === 'en' ? "Share Event & QR Code 📲" : "Condividi Evento & QR Code 📲"}</span>
        </button>

        {/* Calendar Export Menu */}
        {isGoing && (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              <CalendarPlus size={16} />
              <span>{language === 'en' ? "Add to Calendar" : "Aggiungi al tuo Calendario"}</span>
            </button>
            
            {showExportMenu && (
              <div className="glass-panel" style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 20, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-small" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                  📅 {language === 'en' ? "Export to Google Calendar" : "Esporta su Google Calendar"}
                </a>
                <button className="btn btn-secondary btn-small" onClick={downloadIcsFile} style={{ justifyContent: 'flex-start' }}>
                  🍎 {language === 'en' ? "Export to Apple Calendar (.ics)" : "Esporta su Apple Calendar (.ics)"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Map Directions Menu */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowDirectionsMenu(!showDirectionsMenu)}
            style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}
          >
            <Map size={18} />
            <span>{language === 'en' ? "Get Directions" : "Portami Qui"}</span>
          </button>
          
          {showDirectionsMenu && (
            <div className="glass-panel" style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 20, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button className="btn btn-secondary btn-small" onClick={() => openDirections('google')} style={{ justifyContent: 'flex-start' }}>
                🚗 Google Maps
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => openDirections('apple')} style={{ justifyContent: 'flex-start' }}>
                📱 Apple Maps
              </button>
              <button className="btn btn-secondary btn-small" onClick={() => openDirections('waze')} style={{ justifyContent: 'flex-start' }}>
                🚙 Waze
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {language === 'en' ? "Description" : "Descrizione"}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{event.desc}</p>
        </div>

        {/* Utilities Tags */}
        <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '4px', 
            padding: '10px 4px',
            borderRadius: '10px',
            background: event.accessibili ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: event.accessibili ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)'
          }}>
            <span style={{ fontSize: '22px' }}>{event.accessibili ? '♿' : '🚫'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {language === 'en' ? "Accessibility" : "Disabili"}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: event.accessibili ? 'var(--accent-green)' : '#ef4444' }}>
              {event.accessibili ? (language === 'en' ? '✅ Accessible' : '✅ Accessibile') : (language === 'en' ? '❌ No Access' : '❌ NO Accesso')}
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '4px', 
            padding: '10px 4px',
            borderRadius: '10px',
            background: event.animali ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: event.animali ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)'
          }}>
            <span style={{ fontSize: '22px' }}>{event.animali ? '🐕' : '🚫'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {language === 'en' ? "Pets" : "Animali"}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: event.animali ? 'var(--accent-green)' : '#ef4444' }}>
              {event.animali ? (language === 'en' ? '✅ Allowed' : '✅ Ammessi') : (language === 'en' ? '❌ Not Allowed' : '❌ NON Ammessi')}
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '4px', 
            padding: '10px 4px',
            borderRadius: '10px',
            background: event.parcheggio ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: event.parcheggio ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)'
          }}>
            <span style={{ fontSize: '22px' }}>{event.parcheggio ? '🅿️' : '🚫'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {language === 'en' ? "Parking" : "Parcheggio"}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: event.parcheggio ? 'var(--accent-green)' : '#ef4444' }}>
              {event.parcheggio ? (language === 'en' ? '✅ Present' : '✅ Presente') : (language === 'en' ? '❌ No Parking' : '❌ Assente')}
            </span>
          </div>
        </div>

        {/* Photo Gallery */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={18} color="var(--accent-primary)" /> {language === 'en' ? "Photo Gallery" : "Galleria Foto"} ({event.gallery?.length || 0})
            </h3>
            <button 
              className="btn btn-secondary btn-small"
              onClick={() => setShowUploadForm(!showUploadForm)}
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
            >
              <Plus size={14} /> {language === 'en' ? "Add Photo" : "Aggiungi Foto"}
            </button>
          </div>

          {showUploadForm && (
            <div className="glass-panel animate-slide-in" style={{ padding: '16px', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                {language === 'en' ? "Upload a Photo" : "Carica una Foto"}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {PHOTO_PRESETS.map((preset, pIdx) => (
                    <button 
                      key={pIdx}
                      type="button" 
                      className="btn btn-secondary btn-small"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => handleAddPhotoSubmit(null, preset.url)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Device file upload for event photo */}
                <div style={{ marginBottom: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                  <input 
                    type="file" 
                    id="event-photo-file-input" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => handleAddPhotoSubmit(null, evt.target.result);
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  <label 
                    htmlFor="event-photo-file-input" 
                    className="btn btn-secondary" 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', fontSize: '13px' }}
                  >
                    📁 {language === 'en' ? "Upload Photo from Device / Gallery" : "Carica Foto da Galleria o Fotocamera"}
                  </label>
                </div>

                <form onSubmit={handleAddPhotoSubmit}>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === 'en' ? "Or paste an image URL..." : "O incolla l'URL di un'immagine..."}
                      value={uploadUrl}
                      onChange={(e) => setUploadUrl(e.target.value)}
                    />
                  </div>
                  {uploadError && <p style={{ color: 'var(--accent-pink)', fontSize: '12px', marginBottom: '8px' }}>{uploadError}</p>}
                  {uploadSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '12px', marginBottom: '8px' }}>{uploadSuccess}</p>}
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => setShowUploadForm(false)} style={{ flex: 1 }}>
                      {t('cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {language === 'en' ? "Submit" : "Invia"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {event.gallery && event.gallery.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {event.gallery.map((img, idx) => {
                const isObject = typeof img === 'object' && img !== null;
                const imgUrl = isObject ? img.url : img;
                const photoId = isObject ? img.id : `legacy_${idx}`;
                const likesCount = isObject ? (img.likes?.length || 0) : 0;
                const hasLiked = isObject && img.likes?.includes(user?.id);

                return (
                  <div 
                    key={photoId} 
                    onClick={() => setLightboxIndex(idx)}
                    style={{ 
                      position: 'relative',
                      width: '100%', 
                      aspectRatio: '4/3', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      cursor: 'pointer', 
                      border: '1px solid var(--border-glass)', 
                      boxShadow: 'var(--shadow-sm)', 
                      transition: 'transform 0.2s' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Galleria ${idx + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    
                    {/* Likes Overlay on photo */}
                    {isObject && (
                      <div 
                        onClick={(e) => handleToggleLike(e, photoId)}
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          background: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(4px)',
                          color: hasLiked ? 'var(--accent-pink)' : 'white',
                          borderRadius: '12px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        <span style={{ fontSize: '11px' }}>{hasLiked ? '❤️' : '🤍'}</span>
                        <span>{likesCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
              {language === 'en' ? "No photos uploaded for this event. Be the first to upload one!" : "Nessuna foto caricata per questo evento. Sii il primo a caricarne una!"}
            </p>
          )}
        </div>

        {/* Contact Organizer Chat */}
        {(!user || user.id !== event.organizerId) && (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={20} color="var(--accent-primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {language === 'en' ? "Private Organizer Chat" : "Chat Privata con l'Organizzatore"}
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {language === 'en' ? "Have questions about tickets, parking or info? Ask directly in private!" : "Hai dubbi su parcheggi, orari o info? Invia un messaggio diretto in privato!"}
                </p>
              </div>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (!user) {
                  alert(language === 'en' ? "Please log in to start a private chat with the organizer." : "Accedi o registrati per iniziare una chat privata con l'organizzatore.");
                  return;
                }
                onStartChat(event.id, event.organizerId);
              }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '13px' }}
            >
              <MessageSquare size={16} />
              <span>{language === 'en' ? "Start Private Chat" : "💬 Apri Chat Privata con l'Organizzatore"}</span>
            </button>
          </div>
        )}

        {/* Bacheca della Community */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {t('community_board')}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {t('community_sub')}
          </p>

          {/* Messages list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.01)' }}>
            {communityMessages.length > 0 ? (
              communityMessages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  {msg.userAvatar ? (
                    <img 
                      src={msg.userAvatar} 
                      alt={msg.userName} 
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }} 
                    />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="var(--text-secondary)" />
                    </div>
                  )}
                  
                  <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{msg.userName}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{msg.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                {language === 'en' ? "No messages posted. Write the first post!" : "Nessun messaggio pubblicato. Scrivi il primo post!"}
              </p>
            )}
          </div>

          {/* Form to submit community message */}
          {user ? (
            <form onSubmit={handlePostCommunityMessage} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t('send_msg_placeholder')} 
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                style={{ fontSize: '13px', height: '38px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 16px', fontSize: '13px' }}>
                {t('send')}
              </button>
            </form>
          ) : (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              {language === 'en' ? "Log in to post on the community board." : "Accedi per poter scrivere sulla bacheca."}
            </p>
          )}
        </div>

        {/* Updates published by Organizers/Collaborators */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔔 {language === 'en' ? "Announcements & Updates" : "Avvisi & Aggiornamenti"} ({event.updates?.length || 0})
          </h3>
          {event.updates && event.updates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {event.updates.map(up => (
                <div key={up.id} className="glass-card" style={{ padding: '12px', borderLeft: '4px solid var(--accent-primary)', backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{up.text}</p>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    {language === 'en' 
                      ? `Posted on ${new Date(up.date).toLocaleDateString()} at ${new Date(up.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : `Pubblicato il ${new Date(up.date).toLocaleDateString()} alle ${new Date(up.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('no_updates')}</p>
          )}
        </div>

      </div>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div className="modal-overlay animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 300 }}>
          <button 
            onClick={() => setLightboxIndex(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 310 }}
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : event.gallery.length - 1))}
            style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 310 }}
          >
            <ChevronLeft size={24} />
          </button>

          <img 
            src={typeof event.gallery[lightboxIndex] === 'object' && event.gallery[lightboxIndex] !== null ? event.gallery[lightboxIndex].url : event.gallery[lightboxIndex]} 
            alt={`Galleria ${lightboxIndex + 1}`} 
            style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }} 
          />

          <button 
            onClick={() => setLightboxIndex((prev) => (prev < event.gallery.length - 1 ? prev + 1 : 0))}
            style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', zIndex: 310 }}
          >
            <ChevronRight size={24} />
          </button>

          <div style={{ position: 'absolute', bottom: '20px', color: 'white', fontSize: '14px', fontWeight: '500', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
            <span>
              {language === 'en' 
                ? `Photo ${lightboxIndex + 1} of ${event.gallery.length}` 
                : `Foto ${lightboxIndex + 1} di ${event.gallery.length}`}
            </span>
            {typeof event.gallery[lightboxIndex] === 'object' && event.gallery[lightboxIndex] !== null && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                {language === 'en' ? 'Uploaded by:' : 'Caricata da:'} <strong>{event.gallery[lightboxIndex].uploaderName}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Share & QR Code Modal */}
      {showShareModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 400 }}>
          <div className="modal-content" style={{ padding: '24px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={20} color="var(--accent-primary)" /> {language === 'en' ? "Share Event" : "Condividi Evento"}
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* QR Code preview */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#event-' + event.id)}`} 
                alt="Event QR Code"
                style={{ width: '160px', height: '160px', display: 'block' }}
              />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {language === 'en' ? "Scan the QR code or share the direct link with friends!" : "Inquadra il QR code o invia il link diretto agli amici!"}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* WhatsApp Share Button */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Guarda questo evento su EventiApp: "${event.title}" a ${event.location} il ${event.date}! Info e dettagli qui: ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ background: '#25D366', color: 'white', display: 'flex', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <span>📲 {language === 'en' ? "Share on WhatsApp" : "Condividi su WhatsApp"}</span>
              </a>

              {/* Copy Link Button */}
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                {copySuccess ? <CheckCircle2 size={16} color="var(--accent-green)" /> : <Copy size={16} />}
                <span>{copySuccess ? (language === 'en' ? "Link Copied!" : "Link Copiato!") : (language === 'en' ? "Copy Link" : "Copia Link Diretto")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Pass Digital Modal */}
      {showTicketModal && user && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 400 }}>
          <div className="modal-content" style={{ padding: '0', maxWidth: '380px', overflow: 'hidden', borderRadius: '18px' }}>
            {/* Header Ticket Banner */}
            <div style={{ background: 'var(--gradient-primary)', padding: '20px', color: 'white', textAlign: 'center', position: 'relative' }}>
              <button onClick={() => setShowTicketModal(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '0.1em', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                🎟️ PASS DIGITALE INGRESSO
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px', color: 'white' }}>{event.title}</h3>
              <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{event.date} • {event.time}</p>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', textAlign: 'center' }}>
              <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', boxShadow: 'var(--shadow-md)', border: '2px dashed var(--accent-primary)', marginBottom: '16px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`VALID_TICKET:${event.id}:${user.id}:${event.date}`)}`} 
                  alt="Ticket Entrance QR Code"
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              </div>

              <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '14px', marginTop: '4px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Titolare Pass:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.name} {user.cognome}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Codice Biglietto:</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    TKT-{event.id.slice(0,4).toUpperCase()}-{user.id.slice(0,4).toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stato Ingresso:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-green)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                    VALIDATO ✓
                  </span>
                </div>
              </div>

              <button 
                className="btn btn-secondary" 
                onClick={() => setShowTicketModal(false)}
                style={{ width: '100%', marginTop: '20px' }}
              >
                Chiudi Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EVENT MODAL */}
      {showEditModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 200 }}>
          <div className="modal-content" style={{ padding: '20px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold' }}>
                ✏️ {language === 'en' ? "Edit Event" : "Modifica Evento"}
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {editError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', marginBottom: '10px' }}>{editError}</p>}
              {editSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '13px', marginBottom: '10px' }}>{editSuccess}</p>}

              <div className="form-group">
                <label className="form-label">{language === 'en' ? "Title" : "Titolo Evento"}</label>
                <input type="text" className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'en' ? "Description" : "Descrizione"}</label>
                <textarea className="form-input" style={{ height: '80px', resize: 'none' }} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>

              {(!user || event.organizerId === user.id) ? (
                <>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">{language === 'en' ? "Date" : "Data"}</label>
                      <input type="date" className="form-input" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">{language === 'en' ? "Time" : "Ora"}</label>
                      <input type="time" className="form-input" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? "Full Address (Street, Number, Town)" : "Indirizzo Completo dell'Evento (Via, N. Civico, Comune)"}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="es. Via Roma 15, Comignago (NO)..."
                      value={editLocation} 
                      onChange={(e) => {
                        setEditLocation(e.target.value);
                        handleEditGeocode(e.target.value);
                      }} 
                      onBlur={(e) => handleEditGeocode(e.target.value)}
                    />
                    <div style={{ marginTop: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📍</span>
                      <span>
                        <strong>GPS Mappa:</strong> Lat: {editLat}, Lng: {editLng}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">{language === 'en' ? "Category" : "Categoria"}</label>
                      <select className="form-input form-select" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                        <option value="Feste di paese">Feste di paese</option>
                        <option value="Feste nei locali">Feste nei locali</option>
                        <option value="Musica">Musica</option>
                        <option value="Motori">Motori</option>
                        <option value="Escursioni">Escursioni</option>
                        <option value="Sport">Sport</option>
                        <option value="Mercatini">Mercatini</option>
                        <option value="Street food">Street food</option>
                        <option value="Bambini/Famiglie">Bambini/Famiglie</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">{language === 'en' ? "Cost" : "Costo"}</label>
                      <input type="text" className="form-input" value={editCost} onChange={(e) => setEditCost(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">{language === 'en' ? "Capacity" : "Capienza"}</label>
                      <input type="number" className="form-input" value={editMaxCapacity} onChange={(e) => setEditMaxCapacity(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">{language === 'en' ? "Ticket Link" : "Link Biglietti"}</label>
                      <input type="text" className="form-input" value={editTicketUrl} onChange={(e) => setEditTicketUrl(e.target.value)} />
                    </div>
                  </div>

                  {/* Drag and drop / upload poster for Edit Event */}
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? "Poster Image" : "Locandina Evento (Carica o Trascina)"}</label>
                    {editPoster && !editPoster.startsWith('http') && editPoster.trim() !== '' ? (
                      <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '8px' }}>
                        <img src={editPoster} alt="Locandina" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => setEditPoster('')}
                          style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(239, 68, 110, 0.9)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => setEditPoster(evt.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        onClick={() => document.getElementById('edit-poster-file-input').click()}
                        style={{ 
                          border: '2px dashed var(--border-glass)', 
                          borderRadius: '8px', 
                          padding: '16px', 
                          textAlign: 'center', 
                          cursor: 'pointer', 
                          background: 'var(--bg-secondary)', 
                          marginBottom: '8px'
                        }}
                      >
                        <input 
                          type="file" 
                          id="edit-poster-file-input" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => setEditPoster(evt.target.result);
                              reader.readAsDataURL(file);
                            }
                          }} 
                          style={{ display: 'none' }} 
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          📁 Trascina qui l'immagine o <strong style={{ color: 'var(--accent-primary)' }}>clicca per caricare</strong>
                        </p>
                      </div>
                    )}
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="O inserisci link URL esterno..." 
                      value={editPoster} 
                      onChange={(e) => setEditPoster(e.target.value)} 
                      style={{ fontSize: '11px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    <label className="form-label">{language === 'en' ? "Amenities" : "Servizi e utilità"}</label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={editAccessibili} onChange={(e) => setEditAccessibili(e.target.checked)} />
                        {language === 'en' ? "Accessible" : "Disabili"}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={editAnimali} onChange={(e) => setEditAnimali(e.target.checked)} />
                        {language === 'en' ? "Pets Allowed" : "Animali"}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" checked={editParcheggio} onChange={(e) => setEditParcheggio(e.target.checked)} />
                        {language === 'en' ? "Parking" : "Parcheggio"}
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {language === 'en' 
                    ? "As a collaborator, you can only modify the title and description of this event." 
                    : "Come collaboratore, puoi modificare solo il titolo e la descrizione di questo evento."}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)} style={{ flex: 1 }}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {language === 'en' ? "Save" : "Salva"}
                </button>
              </div>

              {/* Only full owners can delete event */}
              {user && event.organizerId === user.id && (
                <button 
                  type="button" 
                  onClick={handleDeleteEvent}
                  className="btn btn-danger"
                  style={{ width: '100%', marginTop: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', boxShadow: 'none' }}
                >
                  🗑️ {language === 'en' ? "Delete Event" : "Elimina Evento Definitivamente"}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
