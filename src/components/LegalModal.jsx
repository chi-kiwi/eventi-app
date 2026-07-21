import React from 'react';
import { ShieldCheck, X, FileText, Info } from 'lucide-react';

export default function LegalModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ padding: '24px', maxWidth: '550px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.15)', padding: '8px', borderRadius: '8px', color: 'var(--accent-primary)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Privacy Policy & Note Legali</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conformità GDPR & Condizioni Generali</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Legal Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              <strong>Informativa Prototipo:</strong> Questa applicazione è una SPA dimostrativa (Prototipo Premium). I dati inseriti sono ospitati unicamente in locale.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FileText size={14} /> 1. Trattamento dei Dati (GDPR)
            </h4>
            <p>
              Ai sensi del Regolamento UE 2016/679 (GDPR), ti informiamo che il Titolare del Trattamento dei dati è <strong>EventiApp S.r.l.</strong>. 
              I dati forniti in fase di registrazione (nome, email, telefono, comune e regione) vengono utilizzati esclusivamente per consentire il corretto funzionamento delle funzionalità social, di gamification e di filtro geografico della community. I dati non vengono ceduti, venduti o comunicati a soggetti terzi per scopi commerciali.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FileText size={14} /> 2. Transazioni e Sicurezza Pagamenti
            </h4>
            <p>
              I servizi commerciali simulati (es. passaggio a account Organizzatore certificato "Spunta Blu") e qualsiasi transazione finanziaria mostrata nel portale sono a scopo puramente illustrativo. 
              <strong>Nessun addebito di denaro reale</strong> viene effettuato e non viene memorizzata alcuna informazione sensibile di carte di credito, PayPal o conti bancari.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FileText size={14} /> 3. Luogo di Conservazione & Svuotamento
            </h4>
            <p>
              I dati personali, i badge sbloccati, i punti esperienza (XP) e la cronologia dei messaggi sono salvati direttamente nella memoria del tuo browser (tramite <code>localStorage</code>). 
              L'utente ha il pieno controllo dei propri dati e può cancellarli completamente in qualsiasi momento cancellando la cronologia del browser o cliccando sul pulsante "Disconnetti" nel proprio profilo.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FileText size={14} /> 4. Diritti dell'Interessato
            </h4>
            <p>
              In conformità con il GDPR, disponi dei diritti di accesso, rettifica, cancellazione (diritto all'oblio), limitazione del trattamento e portabilità dei dati. Per esercitare tali diritti o per qualsiasi richiesta di assistenza di natura legale, puoi inviare un'email all'indirizzo dedicato: <code>privacy@eventiapp.it</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary"
            onClick={onClose}
            style={{ minWidth: '100px' }}
          >
            Ho capito
          </button>
        </div>

      </div>
    </div>
  );
}
