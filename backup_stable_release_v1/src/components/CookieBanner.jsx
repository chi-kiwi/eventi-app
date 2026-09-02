import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check } from 'lucide-react';

export default function CookieBanner({ onOpenPrivacy }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('evt_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('evt_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('evt_cookie_consent', 'essential');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: '540px',
        zIndex: 9999,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ background: 'rgba(255, 71, 87, 0.12)', padding: '10px', borderRadius: '12px', color: 'var(--accent-primary)', display: 'flex' }}>
          <Cookie size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Rispetto della Tua Privacy
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
            EventiApp utilizza cookie tecnici ed il salvataggio in memoria locale per salvare la sessione di accesso, la modalità PWA e le preferenze del tema. Non utilizziamo cookie di tracciamento pubblicitario.{' '}
            <button 
              type="button" 
              onClick={onOpenPrivacy}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            >
              Informativa completa
            </button>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          onClick={handleAcceptEssential}
          className="btn btn-secondary btn-small"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          Solo Essenziali
        </button>
        <button
          onClick={handleAcceptAll}
          className="btn btn-primary btn-small"
          style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Check size={14} /> Accetta Tutti
        </button>
      </div>
    </div>
  );
}
