import React, { useState, useEffect } from 'react';
import { Eye, Heart, Check, Users, MapPin, Calendar, Award, UserPlus, Shield, Sparkles, MessageSquare, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { db, getDistance } from '../services/db';

export default function OrganizerDashboard({ user, events, onRefreshEvents }) {
  const [dashTab, setDashTab] = useState('stats'); // stats / create / collaborators
  
  // Selection of event to view statistics
  const myEvents = events.filter(e => e.organizerId === user.id);
  const [selectedEventId, setSelectedEventId] = useState(myEvents[0]?.id || '');
  const activeEvent = myEvents.find(e => e.id === selectedEventId);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(todayStr);
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('45.4642');
  const [newLng, setNewLng] = useState('9.1900');
  const [newCategory, setNewCategory] = useState('Feste di paese');
  const [newCost, setNewCost] = useState('Gratuito');
  const [newMaxCapacity, setNewMaxCapacity] = useState('150');
  const [newTicketUrl, setNewTicketUrl] = useState('');
  const [newAccessibili, setNewAccessibili] = useState(true);
  const [newAnimali, setNewAnimali] = useState(true);
  const [newParcheggio, setNewParcheggio] = useState(true);
  const [newPoster, setNewPoster] = useState('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600');
  const [formWarning, setFormWarning] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Collaborator Form State
  const [colName, setColName] = useState('');
  const [colCognome, setColCognome] = useState('');
  const [colEmail, setColEmail] = useState('');
  const [colPhone, setColPhone] = useState('');
  const [colPass, setColPass] = useState('');
  const [colError, setColError] = useState('');
  const [colSuccess, setColSuccess] = useState('');

  // Event Updates (published by organizer/collaborator)
  const [newUpdateText, setNewUpdateText] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Refresh counter to trigger re-renders
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load event draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('evt_event_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) setNewTitle(parsed.title);
        if (parsed.desc) setNewDesc(parsed.desc);
        if (parsed.date) setNewDate(parsed.date);
        if (parsed.time) setNewTime(parsed.time);
        if (parsed.location) setNewLocation(parsed.location);
        if (parsed.lat) setNewLat(parsed.lat);
        if (parsed.lng) setNewLng(parsed.lng);
        if (parsed.category) setNewCategory(parsed.category);
        if (parsed.cost) setNewCost(parsed.cost);
        if (parsed.maxCapacity) setNewMaxCapacity(parsed.maxCapacity);
        if (parsed.ticketUrl) setNewTicketUrl(parsed.ticketUrl);
        if (parsed.poster) setNewPoster(parsed.poster);
        if (parsed.accessibili !== undefined) setNewAccessibili(parsed.accessibili);
        if (parsed.animali !== undefined) setNewAnimali(parsed.animali);
        if (parsed.parcheggio !== undefined) setNewParcheggio(parsed.parcheggio);
      } catch (e) {
        console.error("Error loading event draft:", e);
      }
    }
  }, []);

  // Save event draft when fields change
  useEffect(() => {
    const draft = {
      title: newTitle,
      desc: newDesc,
      date: newDate,
      time: newTime,
      location: newLocation,
      lat: newLat,
      lng: newLng,
      category: newCategory,
      cost: newCost,
      maxCapacity: newMaxCapacity,
      ticketUrl: newTicketUrl,
      poster: newPoster,
      accessibili: newAccessibili,
      animali: newAnimali,
      parcheggio: newParcheggio
    };
    localStorage.setItem('evt_event_draft', JSON.stringify(draft));
  }, [newTitle, newDesc, newDate, newTime, newLocation, newLat, newLng, newCategory, newCost, newMaxCapacity, newTicketUrl, newPoster, newAccessibili, newAnimali, newParcheggio]);

  const users = db.getUsers();
  const myCollaborators = users.filter(u => u.role === 'collaboratore' && u.invitedBy === user.id);

  // Dynamic Geocoding from Address using Nominatim
  const handleGeocode = async (address) => {
    if (!address || address.trim().length < 2) return null;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=it&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const latStr = parseFloat(data[0].lat).toFixed(4);
        const lngStr = parseFloat(data[0].lon).toFixed(4);
        setNewLat(latStr);
        setNewLng(lngStr);
        return { lat: latStr, lng: lngStr };
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    }
    return null;
  };

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormWarning('');
    setFormSuccess('');

    if (!newTitle || !newDesc || !newDate || !newTime || !newLocation) {
      setFormWarning("Per favore, compila tutti i campi fondamentali.");
      return;
    }

    // Auto geocode location to get exact lat/lng
    let currentLat = newLat;
    let currentLng = newLng;
    const geoRes = await handleGeocode(newLocation);
    if (geoRes) {
      currentLat = geoRes.lat;
      currentLng = geoRes.lng;
    }

    const eventData = {
      title: newTitle,
      desc: newDesc,
      date: newDate,
      time: newTime,
      location: newLocation,
      gps: { lat: parseFloat(newLat), lng: parseFloat(newLng) },
      category: newCategory,
      cost: newCost,
      maxCapacity: parseInt(newMaxCapacity) || 0,
      ticketUrl: newTicketUrl.trim(),
      accessibili: newAccessibili,
      animali: newAnimali,
      parcheggio: newParcheggio,
      poster: newPoster,
      gallery: []
    };

    // 1. Proximity alert: check if there's already any event within 30 km on the same day
    const sameDayEvents = events.filter(evt => evt.date === newDate);
    const nearbyConflict = sameDayEvents.find(evt => {
      const dist = getDistance(parseFloat(newLat), parseFloat(newLng), evt.gps.lat, evt.gps.lng);
      return dist <= 30;
    });

    if (nearbyConflict) {
      const dist = getDistance(parseFloat(newLat), parseFloat(newLng), nearbyConflict.gps.lat, nearbyConflict.gps.lng).toFixed(1);
      alert(`Attenzione: c'è già un altro evento programmato per questa data entro 30 km di distanza!\n\nEvento: "${nearbyConflict.title}" a ${nearbyConflict.location} (${dist} km di distanza)`);
    }

    // 2. Original proximity check collision (20km warning popup)
    const collision = db.checkCollision(eventData);
    if (collision) {
      const radius = newCategory === 'Feste nei locali' ? 5 : 20;
      const proceed = window.confirm(
        `ATTENZIONE: RILEVATO CONFLITTO DI PROSSIMITÀ!\n\n` +
        `Esiste già un evento nello stesso giorno ed entro un raggio di ${radius} km:\n` +
        `"${collision.title}" (${collision.location})\n\n` +
        `Vuoi procedere comunque con la creazione del tuo evento?`
      );
      if (!proceed) {
        return; // Cancel event creation
      }
    }

    const res = db.createEvent(eventData, user.id);
    if (res.success) {
      setFormSuccess("Evento creato con successo!");
      if (res.warning) {
        setFormWarning(res.warning);
      }
      
      // Clear draft since it is saved
      localStorage.removeItem('evt_event_draft');

      onRefreshEvents();

      // Reset fields
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
      setNewLat('45.4642');
      setNewLng('9.1900');
      setNewPoster('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600');
    }
  };

  // Add event update
  const handleAddUpdate = (e) => {
    e.preventDefault();
    setUpdateSuccess('');
    if (!newUpdateText) return;

    const res = db.addBroadcastUpdate(selectedEventId, newUpdateText, user.id);
    if (res.success) {
      setUpdateSuccess(`📢 Notifica Broadcast inviata in tempo reale a ${res.count} partecipanti registrati!`);
      setNewUpdateText('');
      onRefreshEvents();
    }
  };

  // Invite Collaborator
  const handleInviteCollaborator = (e) => {
    e.preventDefault();
    setColError('');
    setColSuccess('');

    if (!colName || !colCognome || !colEmail || !colPhone || !colPass) {
      setColError("Tutti i campi sono obbligatori.");
      return;
    }

    const res = db.inviteCollaborator(user.id, colEmail, colName, colCognome, colPhone, colPass);
    if (res.success) {
      setColSuccess(`Collaboratore ${colName} invitato con successo!`);
      setColName('');
      setColCognome('');
      setColEmail('');
      setColPhone('');
      setColPass('');
      setRefreshCounter(prev => prev + 1);
    } else {
      setColError(res.message);
    }
  };

  // Remove Collaborator
  const handleRemoveCollaborator = (colId) => {
    const proceed = window.confirm("Sei sicuro di voler rimuovere questo collaboratore?");
    if (!proceed) return;

    const res = db.removeCollaborator(colId, user.id);
    if (res.success) {
      setRefreshCounter(prev => prev + 1);
    } else {
      alert(res.message);
    }
  };

  // Extract Stats for active event
  const getStats = () => {
    if (!activeEvent) return null;

    // Geographic Provenance count
    const geoCount = {};
    const ageRanges = { "18-25": 0, "26-35": 0, "36+": 0 };

    // Simulating provenance and age based on interested and going users
    const participantsIds = [...activeEvent.interestedUsers, ...activeEvent.goingUsers];
    participantsIds.forEach(id => {
      const u = users.find(x => x.id === id);
      if (u) {
        geoCount[u.comune] = (geoCount[u.comune] || 0) + 1;
        if (u.dateOfBirth) {
          const age = new Date().getFullYear() - new Date(u.dateOfBirth).getFullYear();
          if (age <= 25) ageRanges["18-25"]++;
          else if (age <= 35) ageRanges["26-35"]++;
          else ageRanges["36+"]++;
        }
      }
    });

    // Handle feedback reviews
    const feedbackList = activeEvent.feedback || [];
    const avgRating = feedbackList.length > 0 
      ? (feedbackList.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbackList.length).toFixed(1) 
      : "Nessuno";

    return {
      views: activeEvent.views || 0,
      interested: activeEvent.interestedUsers?.length || 0,
      going: activeEvent.goingUsers?.length || 0,
      geo: Object.entries(geoCount),
      age: Object.entries(ageRanges),
      feedback: feedbackList,
      avgRating
    };
  };

  const stats = getStats();

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '30px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px' }}>Cruscotto Organizzatore</h2>
      </div>

      {/* Dashboard Sub Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', marginBottom: '20px' }}>
        <button 
          className={`btn btn-small ${dashTab === 'stats' ? 'btn-primary' : ''}`} 
          style={{ flex: 1, background: dashTab === 'stats' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none' }}
          onClick={() => setDashTab('stats')}
        >
          Statistiche
        </button>
        <button 
          className={`btn btn-small ${dashTab === 'create' ? 'btn-primary' : ''}`} 
          style={{ flex: 1, background: dashTab === 'create' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none' }}
          onClick={() => setDashTab('create')}
        >
          Crea Evento
        </button>
        <button 
          className={`btn btn-small ${dashTab === 'collaborators' ? 'btn-primary' : ''}`} 
          style={{ flex: 1, background: dashTab === 'collaborators' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none' }}
          onClick={() => setDashTab('collaborators')}
        >
          Collaboratori
        </button>
      </div>

      {/* VIEW: STATS */}
      {dashTab === 'stats' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Seleziona Evento da Monitorare</label>
            <select 
              className="form-input form-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {myEvents.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
              {myEvents.length === 0 && <option>Nessun evento organizzato</option>}
            </select>
          </div>

          {activeEvent && stats ? (
            <>
              {/* Event view counter grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
                  <Eye size={20} color="var(--accent-primary)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Visualizzazioni</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>{stats.views}</p>
                </div>
                
                <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
                  <Heart size={20} color="var(--accent-pink)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Interessati</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>{stats.interested}</p>
                </div>

                <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
                  <Check size={20} color="var(--accent-green)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Confermati</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '2px' }}>{stats.going}</p>
                </div>
              </div>

              {/* Geographic Provenance & Age Ranges */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>Provenienza Geografica</h3>
                {stats.geo.length > 0 ? (
                  stats.geo.map(([city, count]) => (
                    <div key={city} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '6px 0' }}>
                      <span>📍 {city}</span>
                      <span style={{ fontWeight: 'bold' }}>{count} utenti</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ancora nessun partecipante registrato.</p>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>Fascia d'Età</h3>
                {stats.going + stats.interested > 0 ? (
                  stats.age.map(([range, count]) => (
                    <div key={range} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '6px 0' }}>
                      <span>👤 {range} anni</span>
                      <span style={{ fontWeight: 'bold' }}>{count} utenti</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nessun dato sull'età disponibile.</p>
                )}
              </div>

              {/* Food & Drink Inventory Estimator Card */}
              <div className="glass-panel" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                  📊 Stima Scorte Food & Drink (Sagre & Eventi)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Stima consigliata in base ai <strong>{stats.going} partecipanti confermati</strong> e <strong>{stats.interested} interessati</strong>:
                </p>

                {(() => {
                  const estimatedPeople = Math.max(20, Math.round(stats.going + (stats.interested * 0.4)));
                  const sandwiches = Math.round(estimatedPeople * 1.25);
                  const beerLiters = (estimatedPeople * 0.75).toFixed(1);
                  const friesPortions = Math.round(estimatedPeople * 0.65);
                  const tablesNeeded = Math.ceil(estimatedPeople / 6);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>🥪</span>
                        <span style={{ color: 'var(--text-muted)' }}>Panini / Piatti Cibo</span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--accent-orange)', marginTop: '2px' }}>~{sandwiches} porzioni</strong>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>🍺</span>
                        <span style={{ color: 'var(--text-muted)' }}>Bevande / Birra</span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--accent-primary)', marginTop: '2px' }}>~{beerLiters} Litri</strong>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>🍟</span>
                        <span style={{ color: 'var(--text-muted)' }}>Contorni / Snack</span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--accent-green)', marginTop: '2px' }}>~{friesPortions} porzioni</strong>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>📦</span>
                        <span style={{ color: 'var(--text-muted)' }}>Posti / Tavoli</span>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>~{tablesNeeded} tavoli</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Publish Event Update / Alerts Form */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📢 Pubblica Avviso / Aggiornamento
                </h3>
                <form onSubmit={handleAddUpdate}>
                  <div className="form-group">
                    <textarea 
                      className="form-input" 
                      placeholder="Scrivi un aggiornamento per questo evento (es. Cambiamenti di orario, allerta meteo, disponibilità)..." 
                      value={newUpdateText}
                      onChange={(e) => setNewUpdateText(e.target.value)}
                      style={{ height: '70px', resize: 'none', fontSize: '13px' }}
                    />
                  </div>
                  {updateSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '13px', marginBottom: '10px' }}>{updateSuccess}</p>}
                  <button type="submit" className="btn btn-primary btn-small">
                    Pubblica Avviso
                  </button>
                </form>
              </div>

              {/* Event Feedback reviews from Users */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                  <h3 style={{ fontSize: '15px' }}>Recensioni & Feedback</h3>
                  <span style={{ fontSize: '13px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>Media: ★ {stats.avgRating}</span>
                </div>
                
                {stats.feedback.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.feedback.map((feed, idx) => (
                      <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>Utente da {feed.userProvenance || 'N/D'} ({feed.userAge ? `${feed.userAge} anni` : 'Età N/D'})</span>
                          <span style={{ color: 'var(--accent-orange)' }}>★ {feed.rating}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>"{feed.text}"</p>
                        {feed.went && <span style={{ color: 'var(--accent-green)', fontSize: '10px', display: 'block', marginTop: '4px' }}>✓ Presenza confermata al questionario</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ancora nessun feedback ricevuto la mattina successiva.</p>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Non hai ancora creato nessun evento. Vai alla scheda "Crea Evento".
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREATE EVENT */}
      {dashTab === 'create' && (
        <form onSubmit={handleCreateEvent} className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Nuovo Evento</h3>
          
          <div className="banner" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', marginBottom: '16px' }}>
            <p className="banner-text" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ✏️ <strong>Modalità Bozza:</strong> I dati inseriti vengono memorizzati in automatico. L'evento verrà <u>pubblicato per la community</u> solo dopo aver cliccato <strong>"Pubblica Evento"</strong> in fondo alla scheda.
            </p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Titolo Evento</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="es. Sagra della Salamella" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descrizione Dettagliata</label>
            <textarea 
              className="form-input" 
              placeholder="Inserisci programma, dettagli culinari, artisti o dettagli utili..." 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ height: '90px', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data</label>
              <input 
                type="date" 
                className="form-input" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Orario</label>
              <input 
                type="time" 
                className="form-input" 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comune / Indirizzo dell'Evento</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="es. Cuggiono, Legnano, Milano, Oleggio..." 
              value={newLocation}
              onChange={(e) => {
                setNewLocation(e.target.value);
                handleGeocode(e.target.value);
              }}
              onBlur={(e) => handleGeocode(e.target.value)}
            />
            <div style={{ marginTop: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📍</span>
              <span>
                <strong>Posizione GPS Rilevata Automaticamente:</strong> Lat: {newLat}, Lng: {newLng}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Categoria</label>
              <select 
                className="form-input form-select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
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
              <label className="form-label">Costo</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="es. Gratuito o €10.00" 
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Posti Totali / Capienza</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="es. 150 (0 = illimitati)" 
                value={newMaxCapacity}
                onChange={(e) => setNewMaxCapacity(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Link Biglietteria Esterna (opzionale)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://www.ticketone.it/..." 
                value={newTicketUrl}
                onChange={(e) => setNewTicketUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">LOCANDINA EVENTO (CARICA O DRAG & DROP)</label>
            {newPoster && !newPoster.startsWith('http') && newPoster.trim() !== '' ? (
              <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '10px' }}>
                <img src={newPoster} alt="Locandina" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  type="button" 
                  onClick={() => setNewPoster('')}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 110, 0.9)', border: 'none', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
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
                    reader.onload = (evt) => setNewPoster(evt.target.result);
                    reader.readAsDataURL(file);
                  }
                }}
                onClick={() => document.getElementById('poster-file-input').click()}
                style={{ 
                  border: '2px dashed var(--border-glass)', 
                  borderRadius: '8px', 
                  padding: '24px', 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  background: 'var(--bg-secondary)', 
                  transition: 'border-color 0.2s',
                  marginBottom: '10px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
              >
                <input 
                  type="file" 
                  id="poster-file-input" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => setNewPoster(evt.target.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ display: 'none' }} 
                />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  📁 Trascina qui l'immagine o <strong style={{ color: 'var(--accent-primary)' }}>clicca per caricare</strong>
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supporta PNG, JPG, JPEG</span>
              </div>
            )}
            
            {/* Fallback text input to allow external links too if they want */}
            <input 
              type="text" 
              className="form-input" 
              placeholder="O inserisci un link URL esterno..." 
              value={newPoster}
              onChange={(e) => setNewPoster(e.target.value)}
              style={{ fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <label className="form-label">Servizi ed Utilità</label>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={newAccessibili} onChange={(e) => setNewAccessibili(e.target.checked)} />
                Accesso Disabili
              </label>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={newAnimali} onChange={(e) => setNewAnimali(e.target.checked)} />
                Animali Ammessi
              </label>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" checked={newParcheggio} onChange={(e) => setNewParcheggio(e.target.checked)} />
                Parcheggio Vicino
              </label>
            </div>
          </div>

          {formWarning && (
            <div className="banner" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--accent-orange)' }}>
              <AlertCircle size={16} color="var(--accent-orange)" className="banner-icon" />
              <p className="banner-text" style={{ color: 'var(--accent-orange)', fontWeight: 500 }}>{formWarning}</p>
            </div>
          )}
          
          {formSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>{formSuccess}</p>}

          <button type="submit" className="btn btn-primary">
            Pubblica Evento
          </button>
        </form>
      )}

      {/* VIEW: COLLABORATORS & SUBSCRIPTION */}
      {dashTab === 'collaborators' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Invite Collaborator Section */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={18} color="var(--accent-primary)" /> Invita Collaboratore
            </h3>
            <form onSubmit={handleInviteCollaborator} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Nome</label>
                  <input type="text" className="form-input" placeholder="Luca" value={colName} onChange={(e) => setColName(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Cognome</label>
                  <input type="text" className="form-input" placeholder="Neri" value={colCognome} onChange={(e) => setColCognome(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Email</label>
                <input type="email" className="form-input" placeholder="collab@events.com" value={colEmail} onChange={(e) => setColEmail(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Telefono</label>
                <input type="tel" className="form-input" placeholder="3401111111" value={colPhone} onChange={(e) => setColPhone(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Password Collaboratore</label>
                <input type="password" className="form-input" placeholder="Crea password temporanea" value={colPass} onChange={(e) => setColPass(e.target.value)} />
              </div>

              {colError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px' }}>{colError}</p>}
              {colSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '13px' }}>{colSuccess}</p>}

              <button type="submit" className="btn btn-secondary">
                Registra Collaboratore
              </button>
            </form>
          </div>

          {/* List of collaborators */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
              I tuoi Collaboratori ({myCollaborators.length})
            </h3>
            {myCollaborators.length > 0 ? (
              myCollaborators.map(c => (
                <div 
                  key={c.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '13px', 
                    margin: '8px 0', 
                    borderBottom: '1px solid var(--border-glass)', 
                    paddingBottom: '8px' 
                  }}
                >
                  <span style={{ fontWeight: '500' }}>💼 {c.name} {c.cognome} ({c.email})</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveCollaborator(c.id)}
                    className="btn btn-danger"
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '11px', 
                      boxShadow: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      color: 'var(--accent-pink)',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    <Trash2 size={13} /> Rimozione
                  </button>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Non hai ancora invitato nessun collaboratore.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
