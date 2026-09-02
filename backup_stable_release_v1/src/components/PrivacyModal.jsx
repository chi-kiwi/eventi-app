import React from 'react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }}>
      <div 
        className="modal-content glass-panel" 
        style={{ 
          maxWidth: '650px', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          padding: '24px', 
          borderRadius: '20px',
          position: 'relative' 
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Chiudi"
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <ShieldCheck size={28} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
              Informativa sulla Privacy & Cookie Policy
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Ai sensi del Regolamento Europeo GDPR (UE 2016/679)
            </span>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <section>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Lock size={16} style={{ color: 'var(--accent-primary)' }} /> 1. Titolare del Trattamento dei Dati
            </h3>
            <p>
              Il titolare del trattamento dei dati personali per l'applicazione <strong>EventiApp</strong> è <strong>Chiara Francescon</strong>. Per qualsiasi richiesta o esercizio dei diritti legati alla privacy, è possibile contattare l'amministrazione all'indirizzo e-mail: <a href="mailto:chiara@eventiapp.com" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>chiara@eventiapp.com</a>.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Eye size={16} style={{ color: 'var(--accent-primary)' }} /> 2. Dati Raccolti e Finalità
            </h3>
            <p>Raccogliamo ed elaboriamo unicamente i dati strettamente necessari all'erogazione dei servizi di EventiApp:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Dati di Registrazione:</strong> Nome, Cognome, E-mail, Numero di Telefono, Comune e Data di Nascita.</li>
              <li><strong>Dati di Geolocalizzazione:</strong> Coordinate GPS inviate volontariamente per trovare eventi nelle vicinanze o impostare la posizione degli eventi organizzati.</li>
              <li><strong>Contenuti Generati dall'Utente:</strong> Messaggi sulla bacheca community, foto dei ricordi, recensioni e messaggi di chat privata.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FileText size={16} style={{ color: 'var(--accent-primary)' }} /> 3. Cookie e Archiviazione Locale (PWA)
            </h3>
            <p>
              EventiApp utilizza cookie tecnici ed il salvataggio in memoria locale (<em>localStorage</em>) per garantire il corretto funzionamento delle sessioni di accesso, l'esperienza di navigazione responsive (PWA), la memorizzazione delle preferenze di tema (Chiaro/Scuro) ed il salvataggio degli eventi nei preferiti. Non vengono utilizzati cookie di profilazione a fini pubblicitari di terze parti.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} /> 4. Diritti dell'Utente (GDPR)
            </h3>
            <p>
              In ogni momento, l'utente ha diritto di richiedere l'accesso ai propri dati personali, la rettifica, la cancellazione definitiva del proprio account e dei dati associati o la limitazione del trattamento inviando una comunicazione via e-mail all'amministratore.
            </p>
          </section>

        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            style={{ minWidth: '120px' }}
          >
            Ho Capito
          </button>
        </div>
      </div>
    </div>
  );
}
