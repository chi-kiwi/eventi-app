import React, { useState } from 'react';
import { Eye, Heart, Check, Users, MapPin, Calendar, Award, UserPlus, Shield, Sparkles, MessageSquare, Plus, AlertCircle } from 'lucide-react';
import { db } from '../services/db';

export default function OrganizerDashboard({ user, events, onRefreshEvents }) {
  const [dashTab, setDashTab] = useState('stats'); // stats / create / collaborators
  
  // Selection of event to view statistics
  const myEvents = events.filter(e => e.organizerId === user.id);
  const [selectedEventId, setSelectedEventId] = useState(myEvents[0]?.id || '');
  const activeEvent = myEvents.find(e => e.id === selectedEventId);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('45.4642');
  const [newLng, setNewLng] = useState('9.1900');
  const [newCategory, setNewCategory] = useState('Feste di paese');
  const [newCost, setNewCost] = useState('Gratuito');
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

  // Premium Activation State
  const [premiumSuccess, setPremiumSuccess] = useState('');

  // Event Updates (published by organizer/collaborator)
  const [newUpdateText, setNewUpdateText] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const users = db.getUsers();
  const myCollaborators = users.filter(u => u.role === 'collaboratore' && u.invitedBy === user.id);

  // Handle Event Creation
  const handleCreateEvent = (e) => {
    e.preventDefault();
    setFormWarning('');
    setFormSuccess('');

    if (!newTitle || !newDesc || !newDate || !newTime || !newLocation) {
      setFormWarning("Per favore, compila tutti i campi fondamentali.");
      return;
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
      accessibili: newAccessibili,
      animali: newAnimali,
      parcheggio: newParcheggio,
      poster: newPoster,
      gallery: []
    };

    // Proximity conflict pre-creation warning confirmation
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
      onRefreshEvents();

      // Reset fields
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
    }
  };

  // Add event update
  const handleAddUpdate = (e) => {
    e.preventDefault();
    setUpdateSuccess('');
    if (!newUpdateText) return;

    const res = db.addEventUpdate(selectedEventId, user.id, newUpdateText);
    if (res.success) {
      setUpdateSuccess("Aggiornamento pubblicato e inviato come notifica!");
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
    } else {
      setColError(res.message);
    }
  };

  // Simulate Premium Activation
  const handleBuyPremium = () => {
    const res = db.activatePremium(user.id);
    if (res.success) {
      setPremiumSuccess("Certificazione attivata con successo! Spunta Blu sbloccata.");
      user.premium = true;
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
        {user.premium && (
          <span className="badge-pill badge-premium" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Spunta Blu Attiva
          </span>
        )}
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
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Nuovo Evento</h3>
          
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
            <label className="form-label">Indirizzo / Luogo</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="es. Milano, Piazza Duomo" 
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">GPS Latitudine</label>
              <input 
                type="text" 
                className="form-input" 
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">GPS Longitudine</label>
              <input 
                type="text" 
                className="form-input" 
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
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

          <div className="form-group">
            <label className="form-label">Link Locandina (URL)</label>
            <input 
              type="text" 
              className="form-input" 
              value={newPoster}
              onChange={(e) => setNewPoster(e.target.value)}
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
          
          {/* Spunta Blu Certification Card (Free) */}
          <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid var(--border-glow)' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Sparkles size={20} color="#60a5fa" /> Badge Organizzatore Certificato
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Diventa un Organizzatore Certificato. Questo metterà in evidenza i tuoi eventi in cima alla home page per far sapere ai partecipanti che l'evento è verificato. L'attivazione è gratuita per tutti gli organizzatori!
            </p>

            {user.premium ? (
              <div style={{ marginTop: '16px', color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={18} /> Certificazione Attiva (Spunta Blu visibile sul tuo profilo ed eventi!)
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                {premiumSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '13px', marginBottom: '10px' }}>{premiumSuccess}</p>}
                <button type="button" className="btn btn-primary" onClick={handleBuyPremium}>
                  Attiva Certificazione Gratuita
                </button>
              </div>
            )}
          </div>

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
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', margin: '8px 0' }}>
                  <span>💼 {c.name} {c.cognome} ({c.email})</span>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 'bold' }}>Attivo</span>
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
