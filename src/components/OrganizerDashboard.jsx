import React, { useState, useEffect } from 'react';
import { Eye, Heart, Check, Users, MapPin, Calendar, Award, UserPlus, Shield, Sparkles, MessageSquare, Plus, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { db, getDistance } from '../services/db';
import { searchItalianComuni } from '../services/comuni';

export default function OrganizerDashboard({ user, events, onRefreshEvents, onSelectEvent }) {
  const [dashTab, setDashTab] = useState('stats'); // stats / create / collaborators
  
  // Safe defensive props
  const safeEvents = Array.isArray(events) ? events : [];
  const safeUser = user || {};

  // Selection of event to view statistics (most recent first)
  const myEvents = safeEvents.filter(e => e && (e.organizerId === safeUser.id || (safeUser.role === 'collaboratore' && e.organizerId === safeUser.invitedBy)));
  const sortedMyEvents = [...myEvents].sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
  const [selectedEventId, setSelectedEventId] = useState(sortedMyEvents[0]?.id || '');
  const activeEvent = sortedMyEvents.find(e => e?.id === selectedEventId) || sortedMyEvents[0];

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

  // Custom Food & Drink stock values per event
  const [customStock, setCustomStock] = useState(null);

  useEffect(() => {
    if (selectedEventId) {
      try {
        const saved = localStorage.getItem(`evt_custom_stock_${selectedEventId}`);
        setCustomStock(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setCustomStock(null);
      }
    } else {
      setCustomStock(null);
    }
  }, [selectedEventId]);

  const handleUpdateCustomStock = (field, val) => {
    if (!selectedEventId) return;
    const stats = activeEvent ? db.getEventStats(activeEvent.id) : null;
    const estPpl = Math.max(20, Math.round((stats?.going || 0) + ((stats?.interested || 0) * 0.4)));
    const current = customStock || {
      sandwiches: Math.round(estPpl * 1.25),
      beerLiters: (estPpl * 0.75).toFixed(1),
      friesPortions: Math.round(estPpl * 0.65),
      tablesNeeded: Math.ceil(estPpl / 6)
    };
    const updated = { ...current, [field]: val };
    setCustomStock(updated);
    localStorage.setItem(`evt_custom_stock_${selectedEventId}`, JSON.stringify(updated));
  };

  const handleResetCustomStock = () => {
    if (!selectedEventId) return;
    setCustomStock(null);
    localStorage.removeItem(`evt_custom_stock_${selectedEventId}`);
  };

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

  // Fetch national address suggestions via OpenStreetMap Nominatim
  const handleFetchAddressSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setGeoSuggestions([]);
      return;
    }

    const cleanQuery = query.trim();
    setIsGeoLoading(true);

    try {
      // 1. Search National Geocoder API
      const remoteMatches = await searchNationalAddress(cleanQuery);
      
      // 2. Search Local Comuni Index
      const localMatches = searchItalianComuni(cleanQuery);

      // 3. Fallback item for user input
      const resolvedLoc = resolveLocationDetails(cleanQuery, user?.regione);
      const customUserOption = {
        label: cleanQuery,
        fullAddress: `📍 Indirizzo Inserito: "${cleanQuery}" (${resolvedLoc.citta} ${resolvedLoc.provincia})`,
        citta: resolvedLoc.citta,
        provincia: resolvedLoc.provincia,
        regione: resolvedLoc.regione,
        cap: '28040',
        nazione: 'Italia',
        lat: resolvedLoc.lat,
        lng: resolvedLoc.lng,
        isPrecise: false,
        isCustom: true
      };

      const combined = [...remoteMatches, ...localMatches, customUserOption];
      const seen = new Set();
      const uniqueSuggestions = combined.filter(item => {
        if (!item || !item.label || seen.has(item.label.toLowerCase())) return false;
        seen.add(item.label.toLowerCase());
        return true;
      });

      setGeoSuggestions(uniqueSuggestions.slice(0, 6));
    } catch (e) {
      console.error("Geocoding fetch error:", e);
    } finally {
      setIsGeoLoading(false);
    }
  };

  const [cityAmbiguityWarning, setCityAmbiguityWarning] = useState('');

  const handleSelectGeoSuggestion = (item) => {
    setNewLocation(item.label || item.fullAddress);
    setNewLat(item.lat);
    setNewLng(item.lng);
    setSelectedGeo(item);
    setIsGeocoded(true);
    setGeoSuggestions([]);

    const precisionText = item.precisionLevel === 'house_number' ? '🎯 Numero Civico Esatto' :
                         item.precisionLevel === 'street' ? '🛣️ Via / Strada' :
                         item.precisionLevel === 'place' ? '🏢 Luogo Specifico' : '📍 Marker Personalizzato';

    setGeoDetails(`📍 ${item.label} • Comune: ${item.citta} (${item.provincia}) • GPS: ${item.lat}, ${item.lng} • Precisione: ${precisionText}`);

    // Check city ambiguity
    const typedLower = newLocation.toLowerCase();
    if (typedLower.length > 3 && item.citta && !typedLower.includes(item.citta.toLowerCase())) {
      setCityAmbiguityWarning(`⚠️ Controlla il comune selezionato: il risultato trovato dal geocoder è ${item.citta} (${item.provincia}), Regione ${item.regione || 'Lombardia'}. Se desideri un altro punto, seleziona una voce diversa dalla tendina o posiziona lo spillo sulla mappa.`);
    } else {
      setCityAmbiguityWarning('');
    }
  };

  const handleMapPinChange = ({ lat, lng }) => {
    setNewLat(lat);
    setNewLng(lng);
    setIsGeocoded(true);
    if (selectedGeo) {
      setSelectedGeo(prev => prev ? { ...prev, lat, lng } : null);
    }
    setGeoDetails(`📍 Posizione Marker Personalizzata • GPS: ${lat}, ${lng}`);
  };

  // Auto GPS Location button handler
  const handleUseCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata dal tuo browser.");
      return;
    }
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latStr = pos.coords.latitude.toFixed(4);
        const lngStr = pos.coords.longitude.toFixed(4);
        setNewLat(latStr);
        setNewLng(lngStr);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latStr}&lon=${lngStr}&addressdetails=1`);
          const data = await res.json();
          if (data && data.display_name) {
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || '';
            const house = addr.house_number || '';
            const town = addr.village || addr.town || addr.city || '';
            const formatted = [road, house, town].filter(Boolean).join(' ');
            const finalAddr = formatted.length > 3 ? formatted : data.display_name.split(',').slice(0, 2).join(',');
            setNewLocation(finalAddr);
            setGeoDetails(`📍 Posizione GPS attuale: ${finalAddr} (${latStr}, ${lngStr})`);
          } else {
            setGeoDetails(`📍 Posizione GPS rilevata: ${latStr}, ${lngStr}`);
          }
        } catch (e) {
          setGeoDetails(`📍 Posizione GPS rilevata: ${latStr}, ${lngStr}`);
        } finally {
          setIsGeoLoading(false);
        }
      },
      (err) => {
        setIsGeoLoading(false);
        alert("Impossibile accedere alla posizione GPS. Verifica i permessi del dispositivo.");
      }
    );
  };

  const [pendingNearbyEvents, setPendingNearbyEvents] = useState([]);
  const [bypassNearbyWarning, setBypassNearbyWarning] = useState(false);

  // Handle Event Creation
  const handleCreateEvent = async (e, forcePublish = false) => {
    if (e) e.preventDefault();
    setFormWarning('');
    setFormSuccess('');

    if (!newTitle || !newTitle.trim() || !newDesc || !newDesc.trim()) {
      setFormWarning("Per favore, inserisci un titolo ed una descrizione per l'evento.");
      return;
    }

    if (!newLocation || !newLocation.trim()) {
      setFormWarning("Indirizzo o località non valida. Inserisci un indirizzo o seleziona una voce dalla lista.");
      return;
    }

    // Default time if empty
    const effectiveTime = newTime && newTime.trim() ? newTime : "20:00";
    const effectiveDate = newDate && newDate.trim() ? newDate : todayStr;

    // Resolve location details
    const resolvedLoc = resolveLocationDetails(newLocation, user?.regione);
    let currentLat = parseFloat(newLat) || resolvedLoc.lat;
    let currentLng = parseFloat(newLng) || resolvedLoc.lng;

    // Proximity warning check for same date within 25 km
    if (!forcePublish && !bypassNearbyWarning) {
      const nearby = db.findNearbyEventsOnDate(effectiveDate, currentLat, currentLng, 25);
      if (nearby.length > 0) {
        setPendingNearbyEvents(nearby);
        return; // stop execution until user responds to nearby modal
      }
    }

    let finalPrecision = selectedGeo?.precisionLevel || 'street';
    if (selectedGeo?.isCustom || !selectedGeo) {
      finalPrecision = /via|corso|piazza|viale|vicolo/i.test(newLocation) ? 'street' : 'city';
    }

    const eventData = {
      title: newTitle.trim(),
      desc: newDesc.trim(),
      date: effectiveDate,
      time: effectiveTime,
      location: newLocation.trim(),
      citta: selectedGeo?.citta || resolvedLoc.citta,
      provincia: selectedGeo?.provincia || resolvedLoc.provincia,
      regione: selectedGeo?.regione || resolvedLoc.regione,
      cap: selectedGeo?.cap || '28040',
      nazione: 'Italia',
      gps: { lat: currentLat, lng: currentLng },
      precisionLevel: finalPrecision,
      placeId: selectedGeo?.placeId || '',
      category: newCategory,
      cost: newCost,
      maxCapacity: parseInt(newMaxCapacity) || 0,
      ticketUrl: newTicketUrl.trim(),
      accessibili: newAccessibili,
      animali: newAnimali,
      parcheggio: newParcheggio,
      poster: newPoster,
      status: newStatus, // 'pubblicato' | 'bozza'
      visibilita: newVisibilita, // 'pubblico' | 'privato'
      gallery: []
    };

    const res = db.createEvent(eventData, user.id);
    if (res.success) {
      if (newStatus === 'pubblicato') {
        setFormSuccess("🎉 Evento creato e pubblicato correttamente nella community!");
      } else {
        setFormSuccess("📑 Evento salvato come bozza (visibile solo nel tuo cruscotto).");
      }

      if (res.warning) {
        setFormWarning(res.warning);
      }
      
      // Clear draft since it is saved
      localStorage.removeItem('evt_event_draft');

      onRefreshEvents();

      if (res.event && res.event.id) {
        setSelectedEventId(res.event.id);
      }

      // Reset fields
      setNewTitle('');
      setNewDesc('');
      setNewDate(todayStr);
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

  const [collabIdInput, setCollabIdInput] = useState('');
  const [inviteMethod, setInviteMethod] = useState('by_id'); // 'by_id' | 'create_new'

  // Invite Collaborator by ID
  const handleInviteCollaboratorById = (e) => {
    e.preventDefault();
    setColError('');
    setColSuccess('');

    if (!collabIdInput.trim()) {
      setColError("Inserisci un ID Collaboratore o l'Email dell'utente.");
      return;
    }

    const res = db.inviteCollaboratorById(user.id, collabIdInput.trim());
    if (res.success) {
      setColSuccess(`🎉 ${res.collaborator.name} ${res.collaborator.cognome} (ID: ${res.collaborator.collabId || res.collaborator.id}) è stato associato con successo al tuo staff!`);
      setCollabIdInput('');
      setRefreshCounter(prev => prev + 1);
    } else {
      setColError(res.message);
    }
  };

  // Invite Collaborator by creating new profile
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
      setColSuccess(`🎉 Collaboratore registrato! ID Generato: ${res.collaborator.collabId || res.collaborator.id}`);
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
      <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        <button 
          className={`btn btn-small ${dashTab === 'stats' ? 'btn-primary' : ''}`} 
          style={{ flex: 1, background: dashTab === 'stats' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none', whiteSpace: 'nowrap' }}
          onClick={() => setDashTab('stats')}
        >
          Statistiche
        </button>
        <button 
          className={`btn btn-small ${dashTab === 'create' ? 'btn-primary' : ''}`} 
          style={{ flex: 1, background: dashTab === 'create' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none', whiteSpace: 'nowrap' }}
          onClick={() => setDashTab('create')}
        >
          Crea Evento
        </button>
        <button 
          className={`btn btn-small ${dashTab === 'collaborators' ? 'btn-primary' : ''}`} 
          style={{ flex: 1, background: dashTab === 'collaborators' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none', whiteSpace: 'nowrap' }}
          onClick={() => setDashTab('collaborators')}
        >
          Collaboratori
        </button>
        {(safeUser.email === 'chiarettafrancescon003@gmail.com' || safeUser.role === 'admin') && (
          <button 
            className={`btn btn-small ${dashTab === 'approvals' ? 'btn-primary' : ''}`} 
            style={{ flex: 1, background: dashTab === 'approvals' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none', whiteSpace: 'nowrap' }}
            onClick={() => setDashTab('approvals')}
          >
            Approvazioni Organizzatori ({db.getPendingOrganizers().length})
          </button>
        )}
      </div>

      {/* VIEW: STATS */}
      {dashTab === 'stats' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Seleziona Evento da Monitorare o Modificare</label>
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
            {activeEvent && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => onSelectEvent && onSelectEvent(activeEvent)}
                  style={{ flex: 1, fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                >
                  ✏️ Modifica / Dettagli
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => {
                    const confirmDel = window.confirm("Sei sicuro di voler eliminare definitivamente questo evento? L'azione non è reversibile.");
                    if (!confirmDel) return;
                    const res = db.deleteEvent(activeEvent.id, user.id);
                    if (res.success) {
                      alert(res.message);
                      if (onRefreshEvents) onRefreshEvents();
                    } else {
                      alert(res.message);
                    }
                  }}
                  style={{ flex: 1, fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Elimina Evento
                </button>
              </div>
            )}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', margin: 0 }}>
                    📊 Gestione Scorte Food & Drink (Personalizzabile)
                  </h3>
                  {customStock && (
                    <button 
                      type="button" 
                      className="btn btn-small"
                      onClick={handleResetCustomStock}
                      style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                    >
                      🔄 Ripristina Calcolo Auto
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Puoi modificare i valori direttamente nelle caselle qui sotto per il tuo evento ({stats.going} confermati, {stats.interested} interessati):
                </p>

                {(() => {
                  const estimatedPeople = Math.max(20, Math.round(stats.going + (stats.interested * 0.4)));
                  const sandwiches = customStock?.sandwiches !== undefined ? customStock.sandwiches : Math.round(estimatedPeople * 1.25);
                  const beerLiters = customStock?.beerLiters !== undefined ? customStock.beerLiters : (estimatedPeople * 0.75).toFixed(1);
                  const friesPortions = customStock?.friesPortions !== undefined ? customStock.friesPortions : Math.round(estimatedPeople * 0.65);
                  const tablesNeeded = customStock?.tablesNeeded !== undefined ? customStock.tablesNeeded : Math.ceil(estimatedPeople / 6);

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
                      
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>🥪</span>
                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Panini / Piatti Cibo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="form-input" 
                            value={sandwiches}
                            onChange={(e) => handleUpdateCustomStock('sandwiches', e.target.value.replace(',', '.'))}
                            style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-orange)', width: '80px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>porzioni</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>🍺</span>
                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Bevande / Birra</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="form-input" 
                            value={beerLiters}
                            onChange={(e) => handleUpdateCustomStock('beerLiters', e.target.value.replace(',', '.'))}
                            style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-primary)', width: '80px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Litri</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>🍟</span>
                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Contorni / Snack</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="form-input" 
                            value={friesPortions}
                            onChange={(e) => handleUpdateCustomStock('friesPortions', e.target.value.replace(',', '.'))}
                            style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-green)', width: '80px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>porzioni</span>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '18px', display: 'block', marginBottom: '2px' }}>📦</span>
                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Posti / Tavoli</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="form-input" 
                            value={tablesNeeded}
                            onChange={(e) => handleUpdateCustomStock('tablesNeeded', e.target.value.replace(',', '.'))}
                            style={{ padding: '4px 8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', width: '80px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>tavoli</span>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* Expandable Private Participants List Section */}
              <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
                <div 
                  onClick={() => setShowParticipantsList(!showParticipantsList)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    👥 Partecipanti Iscritti ({activeEvent ? db.getEventParticipantsList(activeEvent.id).length : 0})
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {showParticipantsList ? '▲ Nascondi' : '▼ Mostra Lista Privata'}
                    </span>
                  </div>
                </div>

                {showParticipantsList && activeEvent && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                    
                    {/* Controls: Search, Filter, Export CSV */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="🔍 Cerca partecipante..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        style={{ flex: '1 1 180px', padding: '6px 12px', fontSize: '12px' }}
                      />

                      <select 
                        className="form-input form-select"
                        value={participantFilterStatus}
                        onChange={(e) => setParticipantFilterStatus(e.target.value)}
                        style={{ width: '140px', padding: '6px 12px', fontSize: '12px' }}
                      >
                        <option value="Tutti">Tutti gli stati</option>
                        <option value="Partecipo">Partecipo ✓</option>
                        <option value="Mi interessa">Mi interessa ❤️</option>
                        <option value="Salvato">Salvato 📌</option>
                      </select>

                      <button 
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          const list = db.getEventParticipantsList(activeEvent.id, user);
                          if (list.length === 0) {
                            alert("Nessun iscritto da esportare.");
                            return;
                          }
                          let csv = "Nome,Stato,Email,Telefono\n";
                          list.forEach(item => {
                            csv += `"${item.name}","${item.status}","${item.email}","${item.phone}"\n`;
                          });
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement("a");
                          link.href = URL.createObjectURL(blob);
                          link.setAttribute("download", `Partecipanti_${activeEvent.title.replace(/\s+/g, '_')}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--gradient-primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        📥 Esporta CSV
                      </button>
                    </div>

                    {/* Participants List */}
                    {(() => {
                      const allList = db.getEventParticipantsList(activeEvent.id, user);
                      const filtered = allList.filter(p => {
                        const matchesSearch = !participantSearch.trim() || p.name.toLowerCase().includes(participantSearch.toLowerCase()) || (p.hasConsent && p.email.toLowerCase().includes(participantSearch.toLowerCase()));
                        const matchesStatus = participantFilterStatus === 'Tutti' || p.status === participantFilterStatus;
                        return matchesSearch && matchesStatus;
                      });

                      if (filtered.length === 0) {
                        return (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                            Nessun iscritto corrisponde ai filtri selezionati.
                          </p>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                          {filtered.map(p => (
                            <div 
                              key={p.id} 
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '12px' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img 
                                  src={p.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                                  alt={p.name} 
                                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <div>
                                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' }}>{p.name}</span>
                                  {p.hasConsent ? (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✉️ {p.email} • 📞 {p.phone}</span>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>🔒 Contatti non condivisi</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span className="badge-pill" style={{ 
                                  backgroundColor: p.status === 'Partecipo' ? 'rgba(16,185,129,0.15)' : (p.status === 'Mi interessa' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)'), 
                                  color: p.status === 'Partecipo' ? 'var(--accent-green)' : (p.status === 'Mi interessa' ? 'var(--accent-pink)' : 'var(--accent-orange)'),
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}>
                                  {p.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
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

          <div className="form-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Indirizzo Completo dell'Evento (Via, N. Civico, Comune)</label>
              <button
                type="button"
                onClick={handleUseCurrentGpsLocation}
                style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid var(--border-glass)', color: 'var(--accent-primary)', cursor: 'pointer', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Usa la posizione GPS attuale"
              >
                📍 Usa Posizione GPS
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              placeholder="es. Via Roma 15, Comignago (NO) o Piazza Duomo 1, Milano..." 
              value={newLocation}
              onChange={(e) => {
                setNewLocation(e.target.value);
                handleFetchAddressSuggestions(e.target.value);
              }}
              onFocus={(e) => handleFetchAddressSuggestions(e.target.value)}
              onBlur={() => setTimeout(() => setGeoSuggestions([]), 350)}
            />

            {/* Live Autocomplete Dropdown List with Province ("La Tendina") */}
            {geoSuggestions.length > 0 && (
              <div 
                className="glass-panel animate-fade-in" 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 300, 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '8px', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  marginTop: '4px',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {geoSuggestions.map((item, idx) => (
                  <div 
                    key={idx} 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectGeoSuggestion(item)}
                    style={{ 
                      padding: '10px 14px', 
                      cursor: 'pointer', 
                      borderBottom: idx < geoSuggestions.length - 1 ? '1px solid var(--border-glass)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>📍 {item.label}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.fullTitle}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Seleziona ✓</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--accent-green)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📍</span>
                <span>
                  <strong>Posizione Mappa GPS Confermato:</strong> {geoDetails || `${newLocation || 'Pombia (NO)'} (Lat: ${newLat}, Lng: ${newLng})`}
                </span>
              </div>
            </div>

            {cityAmbiguityWarning && (
              <div style={{ marginTop: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-orange)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--accent-orange)', fontWeight: 600 }}>
                {cityAmbiguityWarning}
              </div>
            )}

            {/* Interactive Leaflet Map Marker Location Picker */}
            <div style={{ marginTop: '12px' }}>
              <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                🗺️ Anteprima Mappa & Posizionamento Spillo GPS:
              </label>
              <MapLocationPicker 
                lat={parseFloat(newLat)} 
                lng={parseFloat(newLng)} 
                onLocationChange={handleMapPinChange} 
              />
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
          
          {/* Mode Switcher */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserPlus size={18} color="var(--accent-primary)" /> Gestione Invito Collaboratori & Staff
            </h3>

            {/* Toggle method tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => { setInviteMethod('by_id'); setColError(''); setColSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: inviteMethod === 'by_id' ? 'var(--gradient-primary)' : 'transparent',
                  color: inviteMethod === 'by_id' ? 'white' : 'var(--text-secondary)'
                }}
              >
                ⚡ Invita tramite ID Collaboratore (Consigliato)
              </button>
              <button
                type="button"
                onClick={() => { setInviteMethod('create_new'); setColError(''); setColSuccess(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: inviteMethod === 'create_new' ? 'var(--gradient-primary)' : 'transparent',
                  color: inviteMethod === 'create_new' ? 'white' : 'var(--text-secondary)'
                }}
              >
                🆕 Registra Nuovo Collaboratore
              </button>
            </div>

            {/* METHOD A: INVITE VIA ID */}
            {inviteMethod === 'by_id' && (
              <form onSubmit={handleInviteCollaboratorById} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Chiedi al collaboratore il suo <strong>ID Collaboratore</strong> (es. <code>COL-100201</code> o ID utente) o la sua email.
                </p>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>ID Collaboratore o Email Utente</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="es. COL-100201 oppure col_1 oppure email@collaboratore.com" 
                    value={collabIdInput} 
                    onChange={(e) => setCollabIdInput(e.target.value)} 
                    style={{ fontSize: '14px', fontWeight: 'bold' }}
                  />
                </div>

                {colError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px' }}>{colError}</p>}
                {colSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '13px' }}>{colSuccess}</p>}

                <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={16} /> Associa Collaboratore tramite ID
                </button>
              </form>
            )}

            {/* METHOD B: CREATE NEW COLLABORATOR */}
            {inviteMethod === 'create_new' && (
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
                  Registra e Genera ID Collaboratore
                </button>
              </form>
            )}
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
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' }}>💼 {c.name} {c.cognome} ({c.email})</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>ID: {c.collabId || c.id}</span>
                  </div>
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

      {/* VIEW: APPROVALS & INVITE CODES (ADMIN MASTER ONLY) */}
      {dashTab === 'approvals' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Pending Organizers Role Approval Queue */}
          <div className="card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="var(--accent-primary)" />
              Richieste Ruolo Organizzatore in Attesa di Revisione ({db.getPendingOrganizers().length})
            </h3>

            {db.getPendingOrganizers().length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {db.getPendingOrganizers().map(user => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>👤 {user.name} {user.cognome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>✉️ {user.email} • 📱 {user.phone}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 Comune: {user.comune} ({user.regione}) • Ruolo Richiesto: <strong>{user.requestedRole || 'organizzatore'}</strong></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-small"
                        onClick={() => {
                          db.approveOrganizerRole(user.id, safeUser.id);
                          setRefreshCounter(prev => prev + 1);
                        }}
                      >
                        Approva Organizzatore ✅
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-small"
                        onClick={() => {
                          db.rejectUser(user.id, safeUser.id);
                          setRefreshCounter(prev => prev + 1);
                        }}
                      >
                        Rifiuta ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nessuna richiesta di ruolo Organizzatore in sospeso.</p>
            )}
          </div>

          {/* Admin Invite Codes Generator */}
          <div className="card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              Generatore Codici Invito Admin
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Genera codici invito monouso per consentire la registrazione istantanea senza attendere l'approvazione manuale.
            </p>

            <button 
              type="button"
              className="btn btn-primary"
              onClick={() => {
                db.generateInviteCode(safeUser.id, "Invito da Admin Master");
                setRefreshCounter(prev => prev + 1);
              }}
              style={{ marginBottom: '16px' }}
            >
              ➕ Genera Nuovo Codice Invito
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {db.getInviteCodes().map((inv, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 800, letterSpacing: '2px', color: 'var(--accent-primary)', fontSize: '14px' }}>{inv.code}</span>
                    <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>({inv.note})</span>
                  </div>
                  <div>
                    {inv.used ? (
                      <span style={{ color: 'var(--accent-pink)', fontWeight: 700 }}>Usato ❌</span>
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>Disponibile ✅</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Modal Avviso Eventi Vicini nello stesso giorno (≤ 25 km) */}
      {pendingNearbyEvents.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-orange)', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: 'var(--accent-orange)' }}>
              <AlertTriangle size={28} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Attenzione: Eventi Vicini nello Stesso Giorno!
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
              Nello stesso giorno scelto (<strong>{newDate}</strong>) esistono già <strong>{pendingNearbyEvents.length}</strong> eventi programmati entro un raggio di <strong>25 km</strong>:
            </p>

            <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingNearbyEvents.map((evt, idx) => (
                <div key={idx} style={{ background: 'var(--bg-glass)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>📍 {evt.title}</div>
                  <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                    Distanza: <strong>{evt.distanceKm} km</strong> • Comune: {evt.citta} ({evt.provincia})
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                    🕒 Ora: {evt.time} • Organizzatore: {evt.organizerName}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPendingNearbyEvents([])}
                style={{ flex: 1, minWidth: '160px', padding: '10px' }}
              >
                ✏️ Modifica Data o Luogo
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setPendingNearbyEvents([]);
                  setBypassNearbyWarning(true);
                  handleCreateEvent(null, true);
                }}
                style={{ flex: 1, minWidth: '160px', padding: '10px', background: 'var(--gradient-primary)', border: 'none' }}
              >
                🚀 Continua e Pubblica Comunque
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
