import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import LoginRegistration from './components/LoginRegistration';
import Header from './components/Header';
import NavBar from './components/NavBar';
import EventCard from './components/EventCard';
import EventDetails from './components/EventDetails';
import MapTab from './components/MapTab';
import ChatTab from './components/ChatTab';
import OrganizerDashboard from './components/OrganizerDashboard';
import ProfileTab from './components/ProfileTab';
import FeedbackModal from './components/FeedbackModal';
import CalendarTab from './components/CalendarTab';
import LandingPage from './components/LandingPage';
import PrivacyModal from './components/PrivacyModal';
import CookieBanner from './components/CookieBanner';
import { Search, MapPin, Grid, Map, Sparkles } from 'lucide-react';
import { useLanguage } from './services/i18n.jsx';

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('evt_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('evt_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('explore'); // explore, calendar, chats, dashboard, profile
  const [exploreView, setExploreView] = useState('list'); // list, map
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [leagueMemeCelebration, setLeagueMemeCelebration] = useState(null);

  // Unauthenticated landing page & Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load and seed notifications for logged in user
  useEffect(() => {
    if (currentUser) {
      try {
        const stored = localStorage.getItem(`evt_notifications_${currentUser.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
            setUnreadCount(parsed.filter(n => !n.read).length);
            return;
          }
        }
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
      
      const defaultNotifs = [
        {
          id: "notif_1",
          title: "Benvenuto su EventiApp! 🎟️",
          text: "Inizia a esplorare gli eventi della tua regione e accumula punti XP!",
          timestamp: new Date().toISOString(),
          type: "system",
          read: false
        },
        {
          id: "notif_2",
          title: "Lega Argento Raggiunta! 🥈",
          text: "Complimenti! Con 150 punti XP sei entrato nella Lega Argento. Sblocca badge per salire ancora!",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: "league",
          read: false
        }
      ];
      setNotifications(defaultNotifs);
      setUnreadCount(2);
      try {
        localStorage.setItem(`evt_notifications_${currentUser.id}`, JSON.stringify(defaultNotifs));
      } catch (e) {}
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  const handleClearNotifications = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    if (currentUser) {
      localStorage.setItem(`evt_notifications_${currentUser.id}`, JSON.stringify(updated));
    }
  };
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [selectedRegion, setSelectedRegion] = useState('Tutti');

  const categories = [
    "Tutti", "⚡ Stasera cosa faccio?", "Questo Weekend 🥂", "Salvati 📌", "Feste di paese", "Feste nei locali", "Musica", "Motori", "Escursioni", "Sport", 
    "Mercatini", "Street food", "Bambini/Famiglie"
  ];

  const regions = [
    "Tutti", "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", 
    "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", 
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", 
    "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
  ];

  // Initialize and load events
  useEffect(() => {
    setEvents(db.getEvents());
    
    // Auto-login check (optional, but keep it clean)
    try {
      const storedUser = localStorage.getItem("evt_current_user");
      if (storedUser && storedUser !== "undefined") {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error parsing stored user:", e);
      localStorage.removeItem("evt_current_user");
    }
  }, []);

  // Handle Hash URL Deep linking (e.g. #event/evt_1) and page refresh
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#event/')) {
        const eventId = hash.replace('#event/', '');
        const allEvts = db.getEvents();
        const found = allEvts.find(e => e.id === eventId);
        if (found) {
          setSelectedEvent(found);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem("evt_current_user", JSON.stringify(user));
    // Default tab based on role
    if (user.role === 'organizzatore') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('explore');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedEvent(null);
    localStorage.removeItem("evt_current_user");
    setActiveTab('explore');
  };

  const handleRefreshEvents = () => {
    setEvents(db.getEvents());
  };

  const handleToggleParticipation = (eventId, type) => {
    if (!currentUser) {
      alert("Devi effettuare l'accesso per interagire con gli eventi!");
      return;
    }
    const res = db.toggleParticipation(eventId, currentUser.id, type);
    if (res.success) {
      handleRefreshEvents();
      // Update selected event if it's the current one
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({ ...res.event });
      }
    }
  };

  const handleSelectEvent = (event) => {
    db.incrementViews(event.id);
    handleRefreshEvents();
    // Update local object to match incremented view
    setSelectedEvent({ ...event, views: (event.views || 0) + 1 });
  };

  const [activeChatTarget, setActiveChatTarget] = useState(null);

  const handleStartChat = (eventId, organizerId) => {
    if (!currentUser) return;
    const eventObj = events.find(e => e.id === eventId);
    const users = db.getUsers();
    const orgObj = users.find(u => u.id === organizerId);
    const orgName = orgObj ? `${orgObj.name} ${orgObj.cognome}` : 'Organizzatore';
    const eventTitle = eventObj ? eventObj.title : 'Evento';

    const targetChat = {
      eventId,
      otherUserId: organizerId,
      otherUserName: orgName,
      eventTitle
    };

    setActiveChatTarget(targetChat);
    setActiveTab('chats');
    setSelectedEvent(null);
  };

  const handleFeedbackSubmitted = () => {
    // Refresh events and user info (for updated badges and points)
    handleRefreshEvents();
    const users = db.getUsers();
    const updatedUser = users.find(u => u.id === currentUser.id);
    if (updatedUser) {
      // Calculate changes
      const oldBadges = currentUser.badges || [];
      const newBadges = updatedUser.badges || [];
      const newUnlocks = newBadges.filter(b => !oldBadges.includes(b));
      
      let newNotifs = [...notifications];
      
      // XP reward notification
      newNotifs.unshift({
        id: `notif_xp_${Date.now()}`,
        title: `XP Guadagnati! ⚡`,
        text: `Hai ricevuto +50 XP per aver inviato il feedback del tuo evento!`,
        timestamp: new Date().toISOString(),
        type: "system",
        read: false
      });

      // Badge unlocks
      newUnlocks.forEach(b => {
        newNotifs.unshift({
          id: `notif_badge_${Date.now()}_${b}`,
          title: `Nuovo Badge Sbloccato! 🏅`,
          text: `Hai sbloccato il badge: "${b}"!`,
          timestamp: new Date().toISOString(),
          type: "badge",
          read: false
        });
      });

      // League change check
      const getLeagueName = (pts) => {
        if (pts >= 1000) return "Lega Diamante 🏆";
        if (pts >= 500) return "Lega Platino 💎";
        if (pts >= 250) return "Lega Oro 🥇";
        if (pts >= 100) return "Lega Argento 🥈";
        return "Lega Bronzo 🥉";
      };
      const oldLeague = getLeagueName(currentUser.points || 0);
      const newLeague = getLeagueName(updatedUser.points || 0);
      if (oldLeague !== newLeague) {
        newNotifs.unshift({
          id: `notif_league_${Date.now()}`,
          title: `Nuova Lega Raggiunta! 🎉`,
          text: `Sei salito in: ${newLeague}!`,
          timestamp: new Date().toISOString(),
          type: "league",
          read: false
        });

        // Set the celebration meme state
        const memeMap = {
          "Lega Diamante 🏆": "https://media.tenor.com/g91g5xL2QyQAAAAC/trophy-lift.gif",
          "Lega Platino 💎": "https://media.tenor.com/gO14M4Q984wAAAAd/carlton-dance.gif",
          "Lega Oro 🥇": "https://media.tenor.com/F325jF3N218AAAAC/leonardo-dicaprio-cheers.gif",
          "Lega Argento 🥈": "https://media.tenor.com/Z4w294aGvO4AAAAC/minions-yay.gif",
          "Lega Bronzo 🥉": "https://media.tenor.com/D-47nqy1P4IAAAAC/obi-wan-kenobi-star-wars.gif"
        };
        setLeagueMemeCelebration({
          name: newLeague,
          gif: memeMap[newLeague] || "https://media.tenor.com/Z4w294aGvO4AAAAC/minions-yay.gif"
        });
      }

      setNotifications(newNotifs);
      setUnreadCount(newNotifs.filter(n => !n.read).length);
      localStorage.setItem(`evt_notifications_${updatedUser.id}`, JSON.stringify(newNotifs));

      setCurrentUser(updatedUser);
      localStorage.setItem("evt_current_user", JSON.stringify(updatedUser));
    }
  };

  // Filter logic
  const getFilteredEvents = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return events.filter(e => {
      // 1. Status & Privacy Visibility Check:
      const isOwner = currentUser && e.organizerId === currentUser.id;
      const isAdmin = currentUser && currentUser.role === 'admin';
      const isInvited = currentUser && (
        (e.invitedUsers && (e.invitedUsers.includes(currentUser.id) || e.invitedUsers.includes(currentUser.email)))
      );

      // Draft or Cancelled events are ONLY visible to owner/admin
      if (e.status === 'bozza' || e.status === 'annullato') {
        if (!isOwner && !isAdmin) return false;
      }

      // Private/Invited-only events are ONLY visible to owner, admin, or invited participants
      if (e.visibilita === 'privato' || e.visibilita === 'solo_invitati') {
        if (!isOwner && !isAdmin && !isInvited) return false;
      }

      // 2. Active Date Check (future or today only)
      const isActive = !e.date || e.date >= todayStr;
      if (!isActive) return false;

      // 3. Search Query
      const matchesSearch = !searchQuery.trim() || 
                            e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            e.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (e.citta && e.citta.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (e.provincia && e.provincia.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      
      // 4. Category Filter
      let matchesCategory = false;
      if (selectedCategory === '⚡ Stasera cosa faccio?') {
      } else if (selectedCategory === 'Questo Weekend 🥂' || selectedCategory === 'Questo Weekend') {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
        let sat = new Date(now);
        let sun = new Date(now);
        if (dayOfWeek === 0) {
          sat.setDate(now.getDate() - 1);
          sun = now;
        } else if (dayOfWeek === 6) {
          sat = now;
          sun.setDate(now.getDate() + 1);
        } else {
          const daysUntilSat = 6 - dayOfWeek;
          sat.setDate(now.getDate() + daysUntilSat);
          sun.setDate(now.getDate() + daysUntilSat + 1);
        }
        const satStr = sat.toISOString().split('T')[0];
        const sunStr = sun.toISOString().split('T')[0];
        matchesCategory = (e.date === satStr || e.date === sunStr);
      } else if (selectedCategory === 'Tutti') {
        matchesCategory = true;
      } else if (selectedCategory === 'Salvati 📌') {
        matchesCategory = currentUser && (
          e.savedUsers?.includes(currentUser.id) || 
          e.goingUsers?.includes(currentUser.id) || 
          e.interestedUsers?.includes(currentUser.id)
        );
      } else {
        matchesCategory = e.category === selectedCategory;
      }
      if (!matchesCategory) return false;
      
      // 5. Region Filter
      const matchesRegion = selectedRegion === 'Tutti' || 
                            isOwner ||
                            (e.regione && e.regione.toLowerCase().includes(selectedRegion.toLowerCase())) ||
                            e.location.toLowerCase().includes(selectedRegion.toLowerCase());

      return matchesRegion;
    });
  };

  const filteredEvents = getFilteredEvents();

  // Sorting: Premium organizers events should appear first (featured)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const usersList = db.getUsers();
    const orgA = usersList.find(u => u.id === a.organizerId);
    const orgB = usersList.find(u => u.id === b.organizerId);
    const aPremium = orgA?.premium ? 1 : 0;
    const bPremium = orgB?.premium ? 1 : 0;
    return bPremium - aPremium; // Premium (1) before regular (0)
  });

  // Check for pending feedback event to display non-intrusive banner
  const getPendingFeedbackEvent = () => {
    if (!currentUser) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const completedFeedbacks = db.getFeedbackDone();
    return events.find(e => {
      const isPast = e.date < todayStr;
      const isGoing = e.goingUsers?.includes(currentUser.id);
      const notDone = !completedFeedbacks.includes(e.id);
      return isPast && isGoing && notDone;
    });
  };
  const pendingFeedbackEvent = getPendingFeedbackEvent();

  return (
    <div className="app-container">
      
      {/* Dynamic Feedback Survey Modal */}
      {currentUser && (
        <FeedbackModal 
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          user={currentUser} 
          events={events} 
          onFeedbackSubmitted={handleFeedbackSubmitted} 
        />
      )}

      {/* League Level Up celebration modal */}
      {leagueMemeCelebration && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ padding: '24px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Nuova Lega Raggiunta!</h3>
            <h4 style={{ fontSize: '15px', color: 'var(--accent-primary)', fontWeight: 'bold', marginTop: '6px', marginBottom: '16px' }}>
              {leagueMemeCelebration.name}
            </h4>
            
            <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <img 
                src={leagueMemeCelebration.gif} 
                alt="clapping-applause-meme" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,56,92,0.2) 0%, rgba(79,70,229,0.2) 100%)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '50px' }}>🏆</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{leagueMemeCelebration.name}</span>
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Complimenti! Hai accumulato abbastanza XP per salire di rango nella community. Continua così!
            </p>
            
            <button 
              className="btn btn-primary" 
              onClick={() => setLeagueMemeCelebration(null)}
              style={{ width: '100%' }}
            >
              Evvai! 🚀
            </button>
          </div>
        </div>
      )}

      {currentUser ? (
        <>
          {/* Header */}
          <Header 
            user={currentUser} 
            onLogout={handleLogout} 
            onTabChange={(tab) => { setActiveTab(tab); setSelectedEvent(null); }} 
            notifications={notifications}
            unreadCount={unreadCount}
            onClearNotifications={handleClearNotifications}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {selectedEvent ? (
            <EventDetails 
              event={selectedEvent} 
              user={currentUser} 
              onBack={() => setSelectedEvent(null)} 
              onToggleParticipation={handleToggleParticipation}
              onStartChat={handleStartChat}
              onProfileUpdated={setCurrentUser}
              onRefreshEvents={handleRefreshEvents}
            />
          ) : (
            <>
              {/* TAB: EXPLORE / SEARCH EVENTS */}
              {activeTab === 'explore' && (
                <div className="view-content animate-fade-in" style={{ padding: '16px' }}>
                  
                  {/* Search and Filters */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={t('search_placeholder')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                      />
                    </div>

                    <select 
                      className="form-input form-select" 
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      style={{ width: '130px', paddingRight: '30px' }}
                    >
                      <option value="Tutti">{t('region_label')} ({t('all').toLowerCase()})</option>
                      {regions.slice(1).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Horizontal Categories Tags */}
                  <div className="tags-scroll">
                    {categories.map(cat => {
                      const getCategoryLabel = (c) => {
                        if (c === "Tutti") return t('all');
                        if (c === "Salvati 📌") return "📌 " + t('saved_btn');
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
                        <button 
                          key={cat} 
                          className={`tag-pill ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {getCategoryLabel(cat)}
                        </button>
                      );
                    })}
                  </div>

                  {/* View switcher: List vs Map */}
                  <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
                    <button 
                      className={`btn btn-small`} 
                      style={{ flex: 1, background: exploreView === 'list' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none', display: 'flex', gap: '6px' }}
                      onClick={() => setExploreView('list')}
                    >
                      <Grid size={15} /> <span>{t('view_list')}</span>
                    </button>
                    <button 
                      className={`btn btn-small`} 
                      style={{ flex: 1, background: exploreView === 'map' ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none', display: 'flex', gap: '6px' }}
                      onClick={() => setExploreView('map')}
                    >
                      <Map size={15} /> <span>{t('view_map')}</span>
                    </button>
                  </div>

                  {/* List / Map Conditional rendering */}
                  {exploreView === 'list' ? (
                    <div>
                      {/* Clean Non-intrusive feedback survey invitation banner */}
                      {pendingFeedbackEvent && (
                        <div 
                          className="glass-panel" 
                          style={{ 
                            padding: '14px 18px', 
                            background: 'var(--gradient-primary)', 
                            borderRadius: '14px', 
                            marginBottom: '20px', 
                            display: 'flex', 
                            flexWrap: 'wrap',
                            gap: '12px',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: 'var(--shadow-glow)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        >
                          <div style={{ flex: '1 1 240px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                              <Sparkles size={16} /> {t('feedback_title')}
                            </h4>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.95)', marginTop: '4px', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                              {language === 'en' 
                                ? `Leave feedback for "${pendingFeedbackEvent.title}" and earn +50 XP!` 
                                : `Lascia un feedback per "${pendingFeedbackEvent.title}" e ottieni +50 XP!`}
                            </p>
                          </div>
                          <button 
                            type="button"
                            className="btn" 
                            style={{ 
                              width: 'auto',
                              flexShrink: 0,
                              background: '#ffffff', 
                              color: 'var(--accent-primary)', 
                              fontSize: '12px', 
                              fontWeight: '700',
                              padding: '8px 18px', 
                              borderRadius: '20px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onClick={() => setShowFeedbackModal(true)}
                          >
                            {language === 'en' ? "Recensisci Ora ★" : "Recensisci Ora ★"}
                          </button>
                        </div>
                      )}
                      <div className="events-grid">
                        {sortedEvents.map(evt => (
                          <EventCard 
                            key={evt.id}
                            event={evt} 
                            user={currentUser} 
                            onSelect={handleSelectEvent} 
                            onToggleParticipation={handleToggleParticipation}
                          />
                        ))}
                      </div>

                      {sortedEvents.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-glass)', marginTop: '12px' }}>
                          <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔍</span>
                          <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>{t('no_events')}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Filtri attivi: <strong>Regione: {selectedRegion}</strong> • <strong>Categoria: {selectedCategory}</strong>
                          </p>
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedRegion('Tutti');
                              setSelectedCategory('Tutti');
                              setSearchQuery('');
                            }}
                            style={{ width: 'auto', padding: '8px 20px', margin: '0 auto', fontSize: '13px' }}
                          >
                            🔄 Mostra Tutti gli Eventi
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <MapTab events={events} onSelectEvent={handleSelectEvent} user={currentUser} />
                  )}

                </div>
              )}

              {/* TAB: CALENDAR */}
              {activeTab === 'calendar' && (
                <CalendarTab 
                  user={currentUser} 
                  events={events} 
                  onSelectEvent={handleSelectEvent} 
                />
              )}

              {/* TAB: CHATS */}
              {activeTab === 'chats' && (
                <ChatTab user={currentUser} initialActiveChat={activeChatTarget} />
              )}

              {/* TAB: ORGANIZER DASHBOARD */}
              {activeTab === 'dashboard' && (
                <OrganizerDashboard 
                  user={currentUser} 
                  events={events} 
                  onRefreshEvents={handleRefreshEvents} 
                  onSelectEvent={handleSelectEvent}
                />
              )}

              {/* TAB: PROFILE */}
              {activeTab === 'profile' && (
                <ProfileTab user={currentUser} onProfileUpdated={setCurrentUser} />
              )}
            </>
          )}

          {/* Footer Signature */}
          <div style={{ textAlign: 'center', padding: '16px 10px 85px', opacity: 0.85 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
              Realizzato con <span style={{ color: '#ef4444', fontSize: '13px' }}>❤️</span> da <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Chiara Francescon</strong>
              <img 
                src="/logo.jpg" 
                alt="CF Logo" 
                style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover', display: 'inline-block', verticalAlign: 'middle', border: '1px solid var(--border-glass)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </span>
          </div>

          {/* Bottom Bar Navigation */}
          <NavBar currentTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedEvent(null); }} userRole={currentUser.role} />
        </>
      ) : (
        // PUBLIC / UNAUTHENTICATED FLOW
        selectedEvent ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <EventDetails 
              event={selectedEvent} 
              user={null} 
              onBack={() => { setSelectedEvent(null); window.history.replaceState(null, null, ' '); }} 
              onToggleParticipation={() => { setShowAuthModal(true); setAuthMode('login'); }}
              onStartChat={() => { setShowAuthModal(true); setAuthMode('login'); }}
              onProfileUpdated={() => {}}
              onRefreshEvents={handleRefreshEvents}
            />
          </div>
        ) : showAuthModal ? (
          <div style={{ position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setShowAuthModal(false)}
              className="btn btn-secondary btn-small"
              style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 100, width: 'auto', padding: '6px 14px' }}
            >
              ← Torna alla Home
            </button>
            <LoginRegistration 
              initialMode={authMode}
              onLoginSuccess={(u) => { setShowAuthModal(false); handleLoginSuccess(u); }} 
              theme={theme} 
              onToggleTheme={toggleTheme} 
            />
          </div>
        ) : (
          <LandingPage 
            events={events}
            onOpenLogin={() => { setAuthMode('login'); setShowAuthModal(true); }}
            onOpenRegister={() => { setAuthMode('register'); setShowAuthModal(true); }}
            onSelectEvent={handleSelectEvent}
            onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )
      )}

      {/* Global Privacy Modal & Cookie Consent Banner */}
      <PrivacyModal 
        isOpen={isPrivacyModalOpen} 
        onClose={() => setIsPrivacyModalOpen(false)} 
      />

      <CookieBanner 
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)} 
      />

    </div>
  );
}
