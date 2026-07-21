import React, { useState } from 'react';
import { Award, User, Mail, Phone, Lock, Sparkles, CheckCircle2, ShieldAlert, Camera, Settings, X } from 'lucide-react';
import { db } from '../services/db';
import LegalModal from './LegalModal';
import { useLanguage } from '../services/i18n.jsx';

export default function ProfileTab({ user, onProfileUpdated }) {
  const { language, t } = useLanguage();
  // Update fields form state
  const [comune, setComune] = useState(user?.comune || '');
  const [regione, setRegione] = useState(user?.regione || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [interests, setInterests] = useState(user?.interests || []);
  
  // Security validation Modal state
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityOtp, setSecurityOtp] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Modals visibility state
  const [showLeaguesModal, setShowLeaguesModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const interestsList = [
    "Feste di paese", "Feste nei locali", "Musica", "Motori", "Escursioni", "Sport", 
    "Mercatini", "Street food", "Bambini/Famiglie"
  ];

  const regionsList = [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", 
    "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", 
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", 
    "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
  ];

  const AVATAR_PRESETS = [
    { name: "Chiara (Default)", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { name: "Marco (Default)", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
    { name: "Giulia (Default)", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
    { name: "Donna Creativa", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    { name: "Uomo Dinamico", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { name: "Donna Solare", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
    { name: "Uomo Elegante", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" },
    { name: "Ragazza Tech", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" }
  ];

  const LEAGUES = [
    { 
      name: language === 'en' ? "Bronze League 🥉" : "Lega Bronzo 🥉", 
      min: 0, 
      max: 99, 
      badge: "🥉",
      status: language === 'en' ? "Community Novice" : "Novizio della Community",
      gif: "https://media.giphy.com/media/3ornk57KwDXf81rjWM/giphy.gif"
    },
    { 
      name: language === 'en' ? "Silver League 🥈" : "Lega Argento 🥈", 
      min: 100, 
      max: 249, 
      badge: "🥈",
      status: language === 'en' ? "Active Explorer" : "Esploratore Attivo",
      gif: "https://media.giphy.com/media/2xO491sY6UtmaDQAyc/giphy.gif"
    },
    { 
      name: language === 'en' ? "Gold League 🥇" : "Lega Oro 🥇", 
      min: 250, 
      max: 499, 
      badge: "🥇",
      status: language === 'en' ? "Expert Participant" : "Partecipante Esperto",
      gif: "https://media.giphy.com/media/l3q2XHFQOP6WoWmHm/giphy.gif"
    },
    { 
      name: language === 'en' ? "Platinum League 💎" : "Lega Platino 💎", 
      min: 500, 
      max: 999, 
      badge: "💎",
      status: language === 'en' ? "Community Leader" : "Leader della Community",
      gif: "https://media.giphy.com/media/g9582DNuQppazjLH33/giphy.gif"
    },
    { 
      name: language === 'en' ? "Diamond League 🏆" : "Lega Diamante 🏆", 
      min: 1000, 
      max: Infinity, 
      badge: "🏆",
      status: language === 'en' ? "Event Legend" : "Leggenda degli Eventi",
      gif: "https://media.giphy.com/media/oF5oQHhA23vdm/giphy.gif"
    }
  ];

  const userPoints = user.points || 0;
  const currentLeague = LEAGUES.find(l => userPoints >= l.min && userPoints <= l.max) || LEAGUES[0];
  const nextLeague = LEAGUES[LEAGUES.indexOf(currentLeague) + 1] || null;
  
  const getProgressPercent = () => {
    if (currentLeague.max === Infinity) return 100;
    const range = currentLeague.max - currentLeague.min;
    const currentProgress = userPoints - currentLeague.min;
    return Math.min(Math.max((currentProgress / range) * 100, 0), 100);
  };

  const progressPercent = getProgressPercent();

  const handleInterestToggle = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSaveAttempt = (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    
    if (!comune || !regione || !phone || !email || !password) {
      setProfileError("Compila tutti i campi obbligatori.");
      return;
    }

    // Close form modal, open security OTP modal
    setShowEditProfileModal(false);
    setShowSecurityModal(true);
    setSecurityOtp('');
  };

  const handleSecurityConfirm = (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (securityOtp !== '1234') {
      setProfileError("Codice OTP errato. Inserisci '1234' per simulare la conferma.");
      setShowSecurityModal(false);
      setShowEditProfileModal(true); // Reopen form modal
      return;
    }

    const updatedFields = {
      comune,
      regione,
      phone,
      email,
      password,
      interests
    };

    const res = db.updateProfile(user.id, updatedFields, user.password);
    if (res.success) {
      setProfileSuccess("Profilo e credenziali aggiornati con successo!");
      setShowSecurityModal(false);
      onProfileUpdated(res.user);
    } else {
      setProfileError(res.message);
      setShowSecurityModal(false);
      setShowEditProfileModal(true); // Reopen form modal
    }
  };

  const handleSelectAvatarPreset = (url) => {
    const res = db.updateProfile(user.id, { avatar: url }, user.password);
    if (res.success) {
      setProfileSuccess("Foto profilo aggiornata!");
      onProfileUpdated(res.user);
      setShowAvatarModal(false);
    } else {
      setProfileError(res.message);
      setShowAvatarModal(false);
    }
  };

  const handleCustomAvatarSubmit = (e) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    handleSelectAvatarPreset(customAvatarUrl.trim());
  };

  const badgeDetails = {
    "Esploratore": { 
      emoji: "🏔️", 
      desc: language === 'en' ? "Attended at least 1 outdoor event or reached 200 points." : "Hai partecipato ad almeno 1 evento all'aperto o accumulato 200 punti.", 
      color: "#60a5fa" 
    },
    "Re delle feste di paese": { 
      emoji: "🍲", 
      desc: language === 'en' ? "Submitted feedback for a country festival or sagra." : "Hai inviato feedback per una festa di paese o sagra.", 
      color: "#f59e0b" 
    },
    "Amante dei motori": { 
      emoji: "🏎️", 
      desc: language === 'en' ? "Submitted feedback for a motorsport event." : "Hai inviato feedback per un raduno di motori.", 
      color: "#f43f5e" 
    },
    "Cacciatore di concerti": { 
      emoji: "🎸", 
      desc: language === 'en' ? "Submitted feedback for a musical concert event." : "Hai inviato feedback per un evento musicale.", 
      color: "#8b5cf6" 
    }
  };

  if (!user) return <div style={{ padding: '20px', textAlign: 'center' }}>{language === 'en' ? "Please log in to view your profile." : "Accedi per visualizzare il tuo profilo."}</div>;

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Profile Header Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', background: 'var(--gradient-card)' }}>
        
        {/* Interactive Avatar Image */}
        <div 
          onClick={() => setShowAvatarModal(true)}
          style={{ 
            position: 'relative',
            width: '72px', 
            height: '72px', 
            borderRadius: '50%', 
            border: '2.5px solid var(--accent-primary)', 
            boxShadow: 'var(--shadow-glow)',
            cursor: 'pointer',
            overflow: 'hidden',
            flexShrink: 0
          }}
          title={language === 'en' ? "Change profile photo" : "Cambia foto profilo"}
        >
          {user.avatar ? (
            <img src={user.avatar} alt="Foto Profilo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={32} color="var(--accent-primary)" />
            </div>
          )}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '22px',
            background: 'rgba(0, 0, 0, 0.55)',
            color: 'white',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            letterSpacing: '0.05em'
          }}>
            <Camera size={9} style={{ marginRight: '2px' }} /> {language === 'en' ? 'PHOTO' : 'FOTO'}
          </div>
        </div>
        
        <div>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {user.name} {user.cognome}
            {user.premium && <span className="verified-badge" title="Verificato">✓</span>}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {language === 'en' ? 'Role:' : 'Ruolo:'} <strong style={{ textTransform: 'capitalize' }}>
              {user.role === 'organizzatore' ? (language === 'en' ? 'Organizer' : 'organizzatore') : (language === 'en' ? 'User' : 'utente')}
            </strong>
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <Award size={14} color="var(--accent-orange)" />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {user.points} {language === 'en' ? "Experience Points" : "Punti Esperienza"}
            </span>
          </div>
        </div>
      </div>

      {/* Badges Earned Section */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={18} color="var(--accent-orange)" /> {t('unlocked_badges')} ({user.badges?.length || 0})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {user.badges && user.badges.length > 0 ? (
            user.badges.map(b => {
              // Translate badge titles if key is mapped
              let displayBadgeName = b;
              if (language === 'en') {
                if (b === "Esploratore") displayBadgeName = "Explorer";
                if (b === "Re delle feste di paese") displayBadgeName = "Festival King";
                if (b === "Amante dei motori") displayBadgeName = "Gearhead";
                if (b === "Cacciatore di concerti") displayBadgeName = "Concert Hunter";
              }
              const details = badgeDetails[b] || { emoji: "🏅", desc: "Badge sbloccato", color: "var(--accent-primary)" };
              return (
                <div key={b} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: `1px solid rgba(255, 255, 255, 0.04)` }}>
                  <span style={{ fontSize: '26px' }}>{details.emoji}</span>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{displayBadgeName}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{details.desc}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
              {language === 'en' ? "Join events and submit feedback the next morning to unlock your first Badges!" : "Partecipa agli eventi e invia recensioni la mattina dopo per sbloccare i tuoi primi Badge!"}
            </p>
          )}
        </div>
      </div>

      {/* Leagues & Level Summary Card */}
      <div 
        className="glass-panel" 
        onClick={() => setShowLeaguesModal(true)}
        style={{ 
          padding: '16px', 
          marginBottom: '20px', 
          cursor: 'pointer',
          border: '1px solid var(--border-glass)'
        }}
      >
        <h3 style={{ fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
          <Award size={18} color="var(--accent-primary)" /> {language === 'en' ? "Current Level and League" : "Livello e Lega Attuale"}
        </h3>

        {/* Current League Display */}
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)' }}>{currentLeague.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{userPoints} {language === 'en' ? "total XP" : "XP totali"}</span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '4px', transition: 'width 0.4s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            {nextLeague ? (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {language === 'en' 
                  ? `Only ${nextLeague.min - userPoints} XP left to reach ${nextLeague.name}` 
                  : `Mancano ${nextLeague.min - userPoints} XP per raggiungere la ${nextLeague.name}`}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {language === 'en' ? "You are in the top league! 👑" : "Sei nella lega massima! 👑"}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
              {language === 'en' ? "See leagues →" : "Vedi leghe →"}
            </span>
          </div>
        </div>
      </div>

      {/* Album Ricordi & Memory Photo Wall */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
            📸 {language === 'en' ? "My Memory Photo Wall" : "Album dei Miei Ricordi"}
          </h3>
          <span style={{ fontSize: '11px', background: 'var(--gradient-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            {user.goingEvents?.length || 0} {language === 'en' ? 'Events' : 'Eventi'}
          </span>
        </div>

        {user.goingEvents && user.goingEvents.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {db.getEvents()
              .filter(e => user.goingEvents.includes(e.id))
              .map(e => (
                <div 
                  key={e.id}
                  className="glass-card"
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <img 
                    src={e.poster || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300"} 
                    alt={e.title}
                    style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
                  />
                  <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.title}
                  </p>
                  <span style={{ fontSize: '9px', color: 'var(--accent-primary)', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                    🎟️ {e.date}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            {language === 'en' 
              ? "You haven't joined any events yet. Join events to populate your memory album!" 
              : "Non hai ancora partecipato a eventi. Iscriviti agli eventi per riempire il tuo album ricordo!"}
          </p>
        )}
      </div>

      {/* Account Settings / Edit Profile Trigger */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Settings size={18} color="var(--text-secondary)" /> {language === 'en' ? "Profile Settings" : "Impostazioni Profilo"}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          {language === 'en' ? "Update your personal details, credentials, and event interests." : "Aggiorna le tue informazioni personali, la password e le preferenze sugli eventi."}
        </p>

        {profileSuccess && (
          <div className="banner" style={{ borderLeft: '4px solid var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', marginBottom: '12px' }}>
            <CheckCircle2 size={16} color="var(--accent-green)" className="banner-icon" />
            <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="banner" style={{ borderLeft: '4px solid var(--accent-pink)', background: 'rgba(244, 63, 94, 0.1)', marginBottom: '12px' }}>
            <span style={{ color: 'var(--accent-pink)' }}>{profileError}</span>
          </div>
        )}

        <button 
          onClick={() => {
            setComune(user?.comune || '');
            setRegione(user?.regione || '');
            setPhone(user?.phone || '');
            setEmail(user?.email || '');
            setPassword(user?.password || '');
            setInterests(user?.interests || []);
            setProfileError('');
            setProfileSuccess('');
            setShowEditProfileModal(true);
          }}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>⚙️ {t('edit_profile_btn')}</span>
        </button>

        <button 
          type="button"
          onClick={() => setIsLegalOpen(true)}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
        >
          <span>⚖️ {language === 'en' ? "Privacy & GDPR Legal Notes" : "Privacy & Note Legali GDPR"}</span>
        </button>
      </div>

      {/* MODAL 1: LEAGUES DETAILS OVERLAY */}
      {showLeaguesModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 200 }}>
          <div className="modal-content" style={{ padding: '20px', maxWidth: '420px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={20} color="var(--accent-primary)" /> {t('league_details_title')}
              </h3>
              <button 
                onClick={() => setShowLeaguesModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
              {LEAGUES.map(league => {
                const isUserLeague = currentLeague.name === league.name;
                return (
                  <div 
                    key={league.name} 
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: isUserLeague ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)', 
                      background: isUserLeague ? 'rgba(79, 70, 229, 0.06)' : 'var(--bg-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: isUserLeague ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {league.name}
                        </span>
                        {isUserLeague && (
                          <span style={{ fontSize: '10px', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{language === 'en' ? "You" : "Tu"}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4', marginBottom: '6px', fontWeight: '500' }}>
                        Rango: {league.status}
                      </p>
                      <img 
                        src={league.gif} 
                        alt="applause-meme" 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-glass)' }} 
                      />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {league.max === Infinity ? `+${league.min} XP` : `${league.min}-${league.max} XP`}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setShowLeaguesModal(false)}
              className="btn btn-secondary" 
              style={{ marginTop: '16px', width: '100%' }}
            >
              {language === 'en' ? "Close" : "Chiudi"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PROFILE & CREDENTIALS FORM */}
      {showEditProfileModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 200 }}>
          <div className="modal-content" style={{ padding: '20px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings size={20} color="var(--accent-primary)" /> {t('edit_profile_btn')}
              </h3>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAttempt}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1.2 }}>
                  <label className="form-label">{t('comune')}</label>
                  <input type="text" className="form-input" value={comune} onChange={(e) => setComune(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 0.8 }}>
                  <label className="form-label">{t('regione')}</label>
                  <select 
                    className="form-input" 
                    value={regione} 
                    onChange={(e) => setRegione(e.target.value)}
                    style={{ height: '42px', paddingRight: '10px' }}
                  >
                    {regionsList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '40px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'en' ? "Phone" : "Telefono"}</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ paddingLeft: '40px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'en' ? "New Password" : "Nuova Password"}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '40px' }} placeholder={language === 'en' ? "Leave empty or enter new" : "Lascia invariata o inserisci nuova"} />
                </div>
              </div>

              {/* Interests selection */}
              <div className="form-group">
                <label className="form-label">{t('interests_title')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {interestsList.map(interest => {
                    const active = interests.includes(interest);
                    const getInterestLabel = (i) => {
                      if (i === "Feste di paese") return language === 'en' ? "Country Festivals" : "Feste di paese";
                      if (i === "Feste nei locali") return language === 'en' ? "Club Events" : "Feste nei locali";
                      if (i === "Musica") return language === 'en' ? "Music" : "Musica";
                      if (i === "Motori") return language === 'en' ? "Motors" : "Motori";
                      if (i === "Escursioni") return language === 'en' ? "Hiking" : "Escursioni";
                      if (i === "Sport") return language === 'en' ? "Sports" : "Sport";
                      if (i === "Mercatini") return language === 'en' ? "Markets" : "Mercatini";
                      if (i === "Street food") return "Street Food";
                      if (i === "Bambini/Famiglie") return language === 'en' ? "Kids/Family" : "Bambini/Famiglie";
                      return i;
                    };
                    return (
                      <button
                        key={interest}
                        type="button"
                        className={`tag-pill ${active ? 'active' : ''}`}
                        onClick={() => handleInterestToggle(interest)}
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                      >
                        {active ? '☑' : '☐'} {getInterestLabel(interest)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)} style={{ flex: 1 }}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {language === 'en' ? "Continue" : "Continua"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AVATAR SELECTOR MODAL */}
      {showAvatarModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 200 }}>
          <div className="modal-content" style={{ padding: '20px', maxWidth: '440px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={20} color="var(--accent-primary)" /> {language === 'en' ? "Customize Profile Photo" : "Personalizza Foto Profilo"}
              </h3>
              <button 
                onClick={() => setShowAvatarModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {language === 'en' 
                ? "Choose a beautiful profile photo from our selection or enter a custom URL:" 
                : "Scegli una splendida foto profilo tra quelle selezionate per te o inserisci un indirizzo URL personalizzato:"}
            </p>

            {/* Avatar presets grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {AVATAR_PRESETS.map((preset, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectAvatarPreset(preset.url)}
                  style={{
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: user.avatar === preset.url ? '3px solid var(--accent-primary)' : '2px solid transparent',
                    boxShadow: user.avatar === preset.url ? 'var(--shadow-glow)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>

            {/* Custom URL Input Form */}
            <form onSubmit={handleCustomAvatarSubmit} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>{language === 'en' ? "Use Custom Photo URL" : "Usa URL Foto Personalizzato"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://esempio.com/tua-foto.jpg" 
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAvatarModal(false)} style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
                  {language === 'en' ? "Use URL" : "Usa URL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY CONFIRMATION DIALOG MODAL (OTP) */}
      {showSecurityModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 300 }}>
          <div className="modal-content" style={{ padding: '24px', maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '10px', borderRadius: '50%', color: 'var(--accent-pink)' }}>
                <ShieldAlert size={24} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold' }}>{t('otp_title')}</h3>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              {language === 'en'
                ? `To update sensitive information, enter the 4-digit OTP code sent to ${user.email}.`
                : `Per modificare le credenziali o altre informazioni sensibili, inserisci il codice OTP a 4 cifre che abbiamo inviato su ${user.email}.`}
            </p>

            <form onSubmit={handleSecurityConfirm}>
              <div className="form-group">
                <label className="form-label">{language === 'en' ? "Confirmation OTP Code" : "Codice OTP di Conferma"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={language === 'en' ? "Enter 1234" : "Inserisci 1234"} 
                  value={securityOtp}
                  onChange={(e) => setSecurityOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px', fontWeight: 'bold' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowSecurityModal(false);
                    setShowEditProfileModal(true); // Re-open form modal
                  }} 
                  style={{ flex: 1 }}
                >
                  {t('cancel')}
                </button>
                 <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                   {t('save_changes')}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

    </div>
  );
}
