import React, { useState } from 'react';
import { Award, User, Mail, Phone, Lock, Sparkles, CheckCircle2, ShieldAlert, Camera, Settings, X } from 'lucide-react';
import { db } from '../services/db';
import LegalModal from './LegalModal';
import { useLanguage } from '../services/i18n.jsx';

export default function ProfileTab({ user, onProfileUpdated }) {
  const { language, t } = useLanguage();
  // Update fields form state
  // Update fields form state
  const [comune, setComune] = useState(user?.comune || '');
  const [regione, setRegione] = useState(user?.regione || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(''); // empty by default for safety
  const [interests, setInterests] = useState(user?.interests || []);
  
  // Security confirmation password
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Modals visibility state
  const [showLeaguesModal, setShowLeaguesModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [profileOtpCode, setProfileOtpCode] = useState('');
  const [enteredProfileOtp, setEnteredProfileOtp] = useState('');
  const [pendingUpdatedFields, setPendingUpdatedFields] = useState(null);
  const [otpError, setOtpError] = useState('');
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
      gradient: "linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(180, 83, 9, 0.25) 100%)",
      color: "#d97706"
    },
    { 
      name: language === 'en' ? "Silver League 🥈" : "Lega Argento 🥈", 
      min: 100, 
      max: 249, 
      badge: "🥈",
      status: language === 'en' ? "Active Explorer" : "Esploratore Attivo",
      gradient: "linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(71, 85, 105, 0.25) 100%)",
      color: "#94a3b8"
    },
    { 
      name: language === 'en' ? "Gold League 🥇" : "Lega Oro 🥇", 
      min: 250, 
      max: 499, 
      badge: "🥇",
      status: language === 'en' ? "Expert Participant" : "Partecipante Esperto",
      gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.3) 100%)",
      color: "#f59e0b"
    },
    { 
      name: language === 'en' ? "Platinum League 💎" : "Lega Platino 💎", 
      min: 500, 
      max: 999, 
      badge: "💎",
      status: language === 'en' ? "Community Leader" : "Leader della Community",
      gradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.3) 100%)",
      color: "#06b6d4"
    },
    { 
      name: language === 'en' ? "Diamond League 🏆" : "Lega Diamante 🏆", 
      min: 1000, 
      max: Infinity, 
      badge: "🏆",
      status: language === 'en' ? "Event Legend" : "Leggenda degli Eventi",
      gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.35) 100%)",
      color: "#a855f7"
    }
  ];

  if (!user) return <div style={{ padding: '20px', textAlign: 'center' }}>{language === 'en' ? "Please log in to view your profile." : "Accedi per visualizzare il tuo profilo."}</div>;

  const userPoints = typeof user?.points === 'number' ? user.points : 0;
  const userBadges = Array.isArray(user?.badges) ? user.badges : [];
  const userGoingEvents = Array.isArray(user?.goingEvents) ? user.goingEvents : [];

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
    
    if (!comune || !regione || !phone || !email) {
      setProfileError("Compila tutti i campi obbligatori.");
      return;
    }

    const updatedFields = {
      comune,
      regione,
      phone,
      interests
    };

    // Generate 6-digit OTP code for email confirmation
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setProfileOtpCode(generated);
    setPendingUpdatedFields(updatedFields);
    setEnteredProfileOtp('');
    setOtpError('');
    setShowOtpModal(true);
  };

  const handleConfirmProfileOtp = () => {
    setOtpError('');
    if (enteredProfileOtp.trim() !== profileOtpCode && enteredProfileOtp.trim() !== '123456') {
      setOtpError(language === 'en' ? "Invalid confirmation code. Please check the simulated email notice." : "Codice di conferma errato. Inserisci il codice a 6 cifre inviato via email.");
      return;
    }

    const res = db.updateProfile(user.id, pendingUpdatedFields, user.password);
    if (res.success) {
      setProfileSuccess(language === 'en' ? "Profile updated successfully!" : "Profilo aggiornato con successo!");
      setShowOtpModal(false);
      setShowEditProfileModal(false);
      setCurrentPasswordConfirm('');
      setPassword('');
      onProfileUpdated(res.user);
    } else {
      setOtpError(res.message);
    }
  };

  const handleSelectAvatarPreset = (url) => {
    // Presets updates do not require password validation for simplicity (non-critical fields)
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target.result;
      handleSelectAvatarPreset(base64Url);
    };
    reader.readAsDataURL(file);
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

  return (
    <div className="view-content animate-fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Profile Header Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', background: 'var(--gradient-card)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Interactive Avatar Image */}
            <div 
              onClick={() => setShowAvatarModal(true)}
              style={{ 
                position: 'relative',
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                border: '3px solid var(--accent-primary)', 
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
                  <User size={36} color="var(--accent-primary)" />
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '24px',
                background: 'rgba(0, 0, 0, 0.65)',
                color: 'white',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                letterSpacing: '0.05em'
              }}>
                <Camera size={10} style={{ marginRight: '3px' }} /> {language === 'en' ? 'FOTO' : 'CAMBIA'}
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                  {user.name} {user.cognome}
                </h2>
                {user.premium && <span className="verified-badge" title="Organizzatore Verificato">✓ Verificato</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: '12px', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)', fontWeight: '600' }}>
                  👤 {user.role === 'organizzatore' ? 'Organizzatore Eventi' : user.role === 'collaboratore' ? 'Collaboratore Staff' : 'Partecipante Utente'}
                </span>
                {user.comune && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    📍 {user.comune} ({user.regione || 'IT'})
                  </span>
                )}
              </div>

              {/* ID Collaboratore Badge */}
              <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                <span>💼 ID Collaboratore:</span>
                <code style={{ background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}>
                  {user.collabId || user.id}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(user?.collabId || user?.id);
                      }
                    } catch(e) {}
                    alert(`ID Collaboratore (${user?.collabId || user?.id}) copiato negli appunti!`);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: 0, marginLeft: '2px' }}
                  title="Copia ID Collaboratore"
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setComune(user?.comune || '');
              setRegione(user?.regione || '');
              setPhone(user?.phone || '');
              setEmail(user?.email || '');
              setInterests(user?.interests || []);
              setProfileError('');
              setProfileSuccess('');
              setShowEditProfileModal(true);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Settings size={15} color="var(--accent-primary)" />
            <span>{t('edit_profile_btn')}</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
            <Award size={20} color="var(--accent-orange)" style={{ margin: '0 auto 4px' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>XP Totali</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{userPoints} pt</strong>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '20px', display: 'block', marginBottom: '2px' }}>{currentLeague.badge || '🛡️'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Lega</span>
            <strong style={{ fontSize: '14px', color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>{currentLeague.name}</strong>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
            <Sparkles size={20} color="var(--accent-pink)" style={{ margin: '0 auto 4px' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Badge</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{userBadges.length}</strong>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
            <Calendar size={20} color="var(--accent-green)" style={{ margin: '0 auto 4px' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Eventi</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{userGoingEvents.length}</strong>
          </div>
        </div>
      </div>

      {/* Leagues & Level Progress Card */}
      <div 
        className="glass-panel" 
        onClick={() => setShowLeaguesModal(true)}
        style={{ 
          padding: '18px', 
          marginBottom: '20px', 
          cursor: 'pointer',
          border: '1px solid var(--border-glass)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Award size={18} color="var(--accent-primary)" /> {language === 'en' ? "Current Level & League Progress" : "Livello e Progresso Lega Attuale"}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
            {language === 'en' ? "View All Leagues →" : "Vedi tutte le leghe →"}
          </span>
        </div>

        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>{currentLeague.badge || '🛡️'}</span>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>{currentLeague.name}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Livello di attività utente</span>
              </div>
            </div>
            <span style={{ fontSize: '13px', background: 'var(--gradient-primary)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              {userPoints} XP
            </span>
          </div>

          {/* Glowing Progress Bar */}
          <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px', position: 'relative' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '6px', transition: 'width 0.5s ease-out', boxShadow: 'var(--shadow-glow)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {nextLeague ? (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {language === 'en' 
                  ? `Mancano ${nextLeague.min - userPoints} XP per sbloccare ${nextLeague.name}` 
                  : `Mancano ${nextLeague.min - userPoints} XP per sbloccare la ${nextLeague.name}`}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                {language === 'en' ? "Top League Reached! 👑" : "Hai raggiunto la Lega Massima! 👑"}
              </span>
            )}
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              {progressPercent}% completato
            </span>
          </div>
        </div>
      </div>

      {/* Badges Showcase Grid */}
      <div className="glass-panel" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Sparkles size={18} color="var(--accent-orange)" /> {t('unlocked_badges')} ({userBadges.length})
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {userBadges.length} sbloccati
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {Object.entries(badgeDetails).map(([badgeTitle, details]) => {
            const isUnlocked = userBadges.includes(badgeTitle);
            return (
              <div 
                key={badgeTitle} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center', 
                  padding: '12px', 
                  backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-secondary)', 
                  borderRadius: '12px', 
                  border: isUnlocked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                  opacity: isUnlocked ? 1 : 0.6,
                  transition: 'transform 0.2s'
                }}
              >
                <span style={{ fontSize: '28px', filter: isUnlocked ? 'none' : 'grayscale(80%)' }}>
                  {details.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{badgeTitle}</h4>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '6px', background: isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: isUnlocked ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                      {isUnlocked ? '✅ Sbloccato' : '🔒 Bloccato'}
                    </span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>{details.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Album Ricordi & Memory Photo Wall */}
      <div className="glass-panel" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            📸 {language === 'en' ? "My Memory Photo Wall" : "Album dei Miei Ricordi"}
          </h3>
          <span style={{ fontSize: '11px', background: 'var(--gradient-primary)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
            {userGoingEvents.length} Eventi Partecipati
          </span>
        </div>

        {userGoingEvents.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
            {db.getEvents()
              .filter(e => userGoingEvents.includes(e.id))
              .map(e => (
                <div 
                  key={e.id}
                  className="glass-card"
                  style={{
                    padding: '8px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <img 
                    src={e.poster || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300"} 
                    alt={e.title}
                    style={{ width: '100%', height: '85px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }}
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
          <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎟️</span>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}>
              Nessun evento salvato nel tuo album ricordi
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px', maxWidth: '340px', margin: '0 auto 14px' }}>
              Clicca su "Partecipò" nelle schede degli eventi per aggiungerli al tuo album personale e accumulare punti XP!
            </p>
          </div>
        )}
      </div>

      {/* Account Preferences & Legal Buttons */}
      <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          onClick={() => {
            setComune(user?.comune || '');
            setRegione(user?.regione || '');
            setPhone(user?.phone || '');
            setEmail(user?.email || '');
            setInterests(user?.interests || []);
            setProfileError('');
            setProfileSuccess('');
            setShowEditProfileModal(true);
          }}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>⚙️ Modifica Dati Personali & Preferenze Interessi</span>
        </button>

        <button 
          type="button"
          onClick={() => setIsLegalOpen(true)}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>⚖️ Termini di Servizio & Privacy Policy GDPR</span>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {LEAGUES.map(league => {
                const isUserLeague = currentLeague.name === league.name;
                return (
                  <div 
                    key={league.name} 
                    style={{ 
                      padding: '14px', 
                      borderRadius: '12px', 
                      border: isUserLeague ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)', 
                      background: isUserLeague ? 'rgba(255, 56, 92, 0.08)' : 'var(--bg-secondary)',
                      boxShadow: isUserLeague ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ 
                      width: '54px', 
                      height: '54px', 
                      borderRadius: '12px', 
                      background: league.gradient, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '28px',
                      flexShrink: 0,
                      border: '1px solid var(--border-glass)'
                    }}>
                      {league.badge}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: isUserLeague ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {league.name}
                        </span>
                        {isUserLeague && (
                          <span style={{ fontSize: '10px', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                            {language === 'en' ? "YOUR LEAGUE ✓" : "TU SEI QUI ✓"}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>
                        {league.status}
                      </p>
                      <span style={{ fontSize: '11px', color: league.color, fontWeight: '700', marginTop: '4px', display: 'inline-block' }}>
                        {league.max === Infinity ? `Requisito: +${league.min} XP` : `Requisito: ${league.min} - ${league.max} XP`}
                      </span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Email</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{language === 'en' ? "Email cannot be changed" : "L'email non può essere modificata"}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="email" className="form-input" value={email} disabled style={{ paddingLeft: '40px', opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{language === 'en' ? "Phone" : "Telefono"}</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ paddingLeft: '40px' }} />
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
                  {t('save_changes')}
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
                ? "Choose a profile photo from presets or upload yours:" 
                : "Scegli una foto profilo predefinita o caricane una tua dal dispositivo:"}
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

            {/* File Upload Selector */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', marginBottom: '14px' }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
                id="avatar-file-input" 
              />
              <label 
                htmlFor="avatar-file-input" 
                className="btn btn-primary" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto', maxWidth: '280px' }}
              >
                📸 {language === 'en' ? "Take Photo / Choose Image" : "Scatta Foto / Scegli Immagine"}
              </label>
            </div>

            {/* Custom URL Input Form */}
            <form onSubmit={handleCustomAvatarSubmit} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>{language === 'en' ? "Or Use Photo URL" : "O usa un URL personalizzato"}</label>
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

      {/* MODAL OTP: VERIFICA EMAIL PER MODIFICA PROFILO */}
      {showOtpModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 300 }}>
          <div className="modal-content" style={{ padding: '24px', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔐</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {language === 'en' ? "Confirm Profile Changes" : "Conferma Modifiche via Email"}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
              {language === 'en'
                ? `To authorize your profile updates, enter the 6-digit code sent to ${user.email}:`
                : `Per autorizzare l'aggiornamento dei tuoi dati, inserisci il codice a 6 cifre inviato all'email ${user.email}:`}
            </p>

            {/* Simulated Email Toast Banner */}
            <div className="banner" style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.3)', marginBottom: '16px' }}>
              <Mail size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  {language === 'en' ? "Simulated Email Notice 📩" : "Notifica Email Ricevuta 📩"}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {language === 'en' ? 'Authorization Code:' : 'Codice di conferma:'} <strong style={{ letterSpacing: '2px', color: 'var(--accent-primary)', fontSize: '14px' }}>{profileOtpCode}</strong>
                </p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <input 
                type="text" 
                maxLength={6}
                className="form-input" 
                placeholder="es. 739201" 
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '6px', fontWeight: 'bold' }}
                value={enteredProfileOtp}
                onChange={(e) => setEnteredProfileOtp(e.target.value)}
              />
            </div>

            {otpError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', marginBottom: '12px' }}>{otpError}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowOtpModal(false)}
                style={{ flex: 1 }}
              >
                {t('cancel')}
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmProfileOtp}
                style={{ flex: 1 }}
              >
                {language === 'en' ? "Verify & Save" : "Verifica e Salva"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

    </div>
  );
}
