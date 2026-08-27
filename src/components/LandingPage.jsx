import React from 'react';
import { Compass, MapPin, QrCode, MessageSquare, Trophy, ShieldCheck, ArrowRight, Sparkles, UserCheck, Calendar } from 'lucide-react';
import EventCard from './EventCard';

export default function LandingPage({ events = [], onOpenLogin, onOpenRegister, onSelectEvent, onOpenPrivacy, theme, onToggleTheme }) {
  // Show up to 4 upcoming featured events for public preview
  const previewEvents = events.slice(0, 4);

  return (
    <div className="landing-page animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Top Navbar */}
      <header className="app-header" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="app-title" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            📅
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EventiApp
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            onClick={onToggleTheme} 
            className="theme-toggle-btn"
            title="Cambia Tema"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <button 
            className="btn btn-secondary btn-small"
            onClick={onOpenLogin}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Accedi
          </button>
          
          <button 
            className="btn btn-primary btn-small"
            onClick={onOpenRegister}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Registrati
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '60px 20px 40px', textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 71, 87, 0.1)', border: '1px solid var(--border-glow)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', color: 'var(--accent-primary)', fontWeight: '600', marginBottom: '20px' }}>
          <Sparkles size={16} /> La Guida N°1 a Feste, Sagre ed Eventi Vicino a Te
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: '800', lineHeight: '1.25', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          Scopri gli Eventi della Tua Zona, Vivi la Community ed Ottieni Pass QR Code
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px', maxWidth: '700px', margin: '0 auto 32px' }}>
          EventiApp è la piattaforma gratuita che ti permette di trovare sagre, feste nei locali, concerti e mercatini nella tua regione. Esplora sulla mappa GPS, interagisci nella bacheca live e partecipa guadagnando punti XP!
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={onOpenRegister}
            style={{ padding: '14px 28px', fontSize: '16px', minWidth: '200px', boxShadow: 'var(--shadow-glow)' }}
          >
            Unisciti Subito a EventiApp <ArrowRight size={18} />
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onOpenLogin}
            style={{ padding: '14px 28px', fontSize: '16px', minWidth: '160px' }}
          >
            Ho già un Account
          </button>
        </div>
      </section>

      {/* Main Features Showcase Grid */}
      <section style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '36px' }}>
          Perché Utilizzare EventiApp?
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255, 71, 87, 0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <MapPin size={24} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Mappa GPS & Prossimità</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Trova in un attimo gli eventi più vicini a te con le indicazioni stradali integrate per Google Maps, Apple Maps e Waze.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255, 165, 2, 0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-orange)' }}>
              <QrCode size={24} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Pass QR Code Personale</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Iscriviti agli eventi a numero chiuso e ricevi all'istante il tuo Pass digitale QR Code per l'accesso prioritario all'ingresso.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(46, 213, 115, 0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
              <MessageSquare size={24} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Bacheca Community Live</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Fai domande agli organizzatori, interagisci con gli altri partecipanti e condividi le foto dell'album ricordi.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(10, 189, 227, 0.12)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Trophy size={24} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Leghe XP & Badge</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              Accumula punti XP partecipando agli eventi, scala le leghe (Bronzo, Argento, Oro, Diamante) e sblocca badge esclusivi!
            </p>
          </div>

        </div>
      </section>

      {/* Featured Preview Events */}
      {previewEvents.length > 0 ? (
        <section style={{ padding: '40px 20px 60px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Eventi in Arrivo</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Una selezione degli eventi in evidenza nella community</p>
            </div>
            <button 
              className="btn btn-secondary btn-small"
              onClick={onOpenRegister}
              style={{ fontSize: '13px' }}
            >
              Vedi Tutti gli Eventi <ArrowRight size={14} />
            </button>
          </div>

          <div className="events-grid">
            {previewEvents.map(evt => (
              <EventCard 
                key={evt.id}
                event={evt}
                user={null}
                onSelect={(selected) => onSelectEvent ? onSelectEvent(selected) : onOpenLogin()}
                onToggleParticipation={onOpenLogin}
              />
            ))}
          </div>
        </section>
      ) : (
        <section style={{ padding: '40px 20px 60px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px 20px', borderRadius: '20px' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🗓️</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Nessun evento in programma al momento
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 16px' }}>
              Gli organizzatori stanno preparando i prossimi eventi locali. Torna a trovarci a breve o pubblica il tuo primo evento!
            </p>
            <button className="btn btn-primary btn-small" onClick={onOpenRegister}>
              ✨ Pubblica un Evento
            </button>
          </div>
        </section>
      )}

      {/* Call To Action Banner */}
      <section style={{ padding: '60px 20px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Sei un Organizzatore di Eventi?</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
            Pubblica i tuoi eventi in pochi secondi, gestisci la capienza dei partecipanti, monitora la gestione delle scorte e comunica in tempo reale con i tuoi visitatori!
          </p>
          <button 
            className="btn btn-primary"
            onClick={onOpenRegister}
            style={{ padding: '12px 28px', fontSize: '15px' }}
          >
            Crea un Account Organizzatore
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '30px 20px', textAlign: 'center', borderTop: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
          <button 
            onClick={onOpenPrivacy}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
          >
            Privacy & Cookie Policy
          </button>
          <button 
            onClick={onOpenLogin}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
          >
            Accedi
          </button>
          <button 
            onClick={onOpenRegister}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
          >
            Registrati
          </button>
        </div>

        <div style={{ opacity: 0.85, marginTop: '4px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Realizzato con cura da 
            <img 
              src="/logo.jpg" 
              alt="CF Logo" 
              style={{ width: '16px', height: '16px', borderRadius: '3px', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            /> 
            <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Chiara Francescon</strong>
          </span>
        </div>
      </footer>

    </div>
  );
}
