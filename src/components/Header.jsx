import React, { useState } from 'react';
import { LogOut, Award, Bell, BellRing, X, Info, User } from 'lucide-react';
import { useLanguage } from '../services/i18n.jsx';

export default function Header({ user, onLogout, onTabChange, notifications = [], unreadCount = 0, onClearNotifications }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="app-header" style={{ position: 'relative' }}>
      <div className="app-title" style={{ cursor: 'pointer' }} onClick={() => onTabChange('explore')}>
        <span>🎟️ EventiApp</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Points Badge */}
            <div 
              onClick={() => onTabChange('profile')} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                background: 'rgba(255, 255, 255, 0.12)', 
                backdropFilter: 'blur(8px)',
                padding: '6px 12px', 
                borderRadius: '20px', 
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            >
              <Award size={14} color="#f59e0b" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                {user.points} pt
              </span>
            </div>

            {/* Profile Avatar Badge */}
            <div 
              onClick={() => onTabChange('profile')} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(255, 255, 255, 0.12)', 
                backdropFilter: 'blur(8px)',
                padding: '4px 12px 4px 4px', 
                borderRadius: '20px', 
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                height: '32px'
              }}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.4)' }} 
                />
              ) : (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={12} color="#ffffff" />
                </div>
              )}
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                {user.name}
              </span>
              {user.premium && (
                <span className="verified-badge" style={{ marginLeft: '-2px' }} title="Verificato">✓</span>
              )}
            </div>
          </div>
        )}

        {/* Bell Notifications Button */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleNotifications}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                color: unreadCount > 0 ? '#f43f5e' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {unreadCount > 0 ? <BellRing size={18} className="animate-fade-in" color="#f43f5e" /> : <Bell size={18} color="#e2e8f0" />}
              {unreadCount > 0 && (
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    right: '2px', 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#f43f5e', 
                    border: '1px solid white' 
                  }} 
                />
              )}
            </button>

            {/* Notification Drawer Dropdown */}
            {showNotifications && (
              <div 
                className="glass-panel animate-slide-in" 
                style={{ 
                  position: 'absolute', 
                  top: '40px', 
                  right: '-50px', 
                  width: '280px', 
                  maxHeight: '360px', 
                  overflowY: 'auto', 
                  zIndex: 150, 
                  padding: '16px',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {language === 'en' ? 'Notifications' : 'Notifiche'} ({notifications.length})
                  </h4>
                  <button 
                    onClick={() => { onClearNotifications(); setShowNotifications(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {language === 'en' ? "Mark as read" : "Segna come lette"}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications.map(n => {
                    // Translate notification content dynamically
                    let displayTitle = n.title;
                    let displayText = n.text;
                    if (n.title.includes("Benvenuto su EventiApp")) {
                      displayTitle = language === 'en' ? "Welcome to EventiApp! 🎟️" : "Benvenuto su EventiApp! 🎟️";
                      displayText = language === 'en' ? "Start exploring regional events and earn XP points!" : "Inizia a esplorare gli eventi della tua regione e accumula punti XP!";
                    } else if (n.title.includes("Lega Argento")) {
                      displayTitle = language === 'en' ? "Silver League Reached! 🥈" : "Lega Argento Raggiunta! 🥈";
                      displayText = language === 'en' ? `Congrats! With ${user.points} XP you entered the Silver League.` : `Complimenti! Con ${user.points} XP sei entrato nella Lega Argento.`;
                    }
                    return (
                      <div 
                        key={n.id} 
                        style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          fontSize: '12px', 
                          paddingBottom: '8px', 
                          borderBottom: '1px solid rgba(0,0,0,0.02)',
                          alignItems: 'flex-start',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ marginTop: '2px' }}>
                          {n.type === 'badge' ? '🏅' : n.type === 'league' ? '🏆' : '🔔'}
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{displayTitle}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>{displayText}</p>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      {language === 'en' ? "No notifications." : "Nessuna notifica presente."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Language Switcher Flag */}
        <button
          onClick={() => setLanguage(language === 'it' ? 'en' : 'it')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
          title={language === 'it' ? "Switch to English" : "Cambia in Italiano"}
        >
          {language === 'it' ? '🇮🇹' : '🇬🇧'}
        </button>

        <button 
          onClick={onLogout} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#e2e8f0', 
            display: 'flex', 
            alignItems: 'center',
            padding: '6px'
          }}
          title={t('logout')}
        >
          <LogOut size={20} color="#e2e8f0" />
        </button>
      </div>
    </header>
  );
}
