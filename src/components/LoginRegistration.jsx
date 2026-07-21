import React, { useState } from 'react';
import { Mail, Phone, Lock, User, MapPin, Eye, EyeOff, CheckCircle, RefreshCw, Sun, Moon } from 'lucide-react';
import { db } from '../services/db';
import LegalModal from './LegalModal';
import { useLanguage } from '../services/i18n.jsx';

export default function LoginRegistration({ onLoginSuccess, theme, onToggleTheme }) {
  const { language, setLanguage, t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [isRecover, setIsRecover] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false); // verification flow
  const [tempUser, setTempUser] = useState(null); // hold registered user before verify
  
  // Login Form States
  const [loginCred, setLoginCred] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regCognome, setRegCognome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regComune, setRegComune] = useState('');
  const [regRegione, setRegRegione] = useState('Lombardia');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState('utente'); // utente / organizzatore
  const [regInterests, setRegInterests] = useState([]);
  const [regError, setRegError] = useState('');

  // Verification State
  const [otpCode, setOtpCode] = useState('');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Recovery States
  const [recoveryContact, setRecoveryContact] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Send contact, 2: OTP & New pass
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

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

  const handleInterestToggle = (interest) => {
    if (regInterests.includes(interest)) {
      setRegInterests(regInterests.filter(i => i !== interest));
    } else {
      setRegInterests([...regInterests, interest]);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginCred || !loginPass) {
      setLoginError(language === 'en' ? "Please enter all credentials." : "Per favore, inserisci tutte le credenziali.");
      return;
    }
    const cleanCred = loginCred.trim();
    const res = db.login(cleanCred, loginPass);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setLoginError(res.message);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regCognome || !regEmail || !regPhone || !regComune || !regPass) {
      setRegError(language === 'en' ? "Please fill in all required fields." : "Per favore, compila tutti i campi obbligatori.");
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();
    const cleanName = regName.trim();
    const cleanCognome = regCognome.trim();
    const cleanComune = regComune.trim();

    // Uniqueness checks in db
    const users = db.getUsers();
    if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      setRegError(language === 'en' ? "This email is already registered." : "Questa email è già associata a un altro account.");
      return;
    }
    if (users.some(u => u.phone === cleanPhone)) {
      setRegError(language === 'en' ? "This phone number is already registered." : "Questo numero di telefono è già associato a un altro account.");
      return;
    }

    const defaultAvatar = regRole === 'organizzatore'
      ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";

    const res = db.register({
      name: cleanName,
      cognome: cleanCognome,
      email: cleanEmail,
      phone: cleanPhone,
      comune: cleanComune,
      regione: regRegione,
      password: regPass,
      role: regRole,
      interests: regInterests,
      avatar: defaultAvatar
    });

    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setRegError(res.message);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');
    const cleanContact = recoveryContact.trim().toLowerCase();
    if (!recoveryContact || !recoveryNewPass) {
      setRecoveryError(language === 'en' ? "Please fill all fields." : "Compila tutti i campi.");
      return;
    }
    const users = db.getUsers();
    const userExists = users.some(u => 
      (u.email && u.email.toLowerCase() === cleanContact) || 
      (u.phone === cleanContact)
    );
    if (!userExists) {
      setRecoveryError(language === 'en' ? "No account associated with this contact." : "Nessun account associato a questo recapito.");
      return;
    }
    const res = db.resetPassword(cleanContact, recoveryNewPass);
    if (res.success) {
      setRecoverySuccess(language === 'en' ? "Password reset successfully! Redirecting to login..." : "Password reimpostata con successo! Verrai reindirizzato al login.");
      setTimeout(() => {
        setIsRecover(false);
        setRecoverySuccess('');
        setRecoveryContact('');
        setRecoveryNewPass('');
        setIsLogin(true);
      }, 2000);
    } else {
      setRecoveryError(res.message);
    }
  };

  const ThemeLangBar = () => (
    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
      <button
        onClick={onToggleTheme}
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}
        title={theme === 'light' ? (language === 'it' ? "Attiva modalità scura" : "Switch to dark mode") : (language === 'it' ? "Attiva modalità chiara" : "Switch to light mode")}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <button
        onClick={() => setLanguage(language === 'it' ? 'en' : 'it')}
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}
        title={language === 'it' ? "Switch to English" : "Cambia in Italiano"}
      >
        {language === 'it' ? '🇮🇹' : '🇬🇧'}
      </button>
    </div>
  );

  if (isRecover) {
    return (
      <div className="view-content animate-slide-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '90vh', position: 'relative', width: '100%', maxWidth: '440px', margin: '0 auto', padding: '40px 20px' }}>
        <ThemeLangBar />
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>{language === 'en' ? "Password Recovery" : "Recupero Password"}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
            {language === 'en' ? "Enter your contact and your new password." : "Inserisci il tuo contatto e la nuova password."}
          </p>

          {recoverySuccess && (
            <div className="banner" style={{ borderLeft: '4px solid var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent-green)', fontSize: '13px' }}>{recoverySuccess}</span>
            </div>
          )}

          <form onSubmit={handleRecoverySubmit}>
            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Email or Mobile Number" : "Email o Numero di Telefono"}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="email@example.com o 3331234567" 
                  value={recoveryContact}
                  onChange={(e) => setRecoveryContact(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'en' ? "New Password" : "Nuova Password"}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder={language === 'en' ? "Create a new password" : "Crea una nuova password"} 
                  value={recoveryNewPass}
                  onChange={(e) => setRecoveryNewPass(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {recoveryError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', margin: '-8px 0 16px' }}>{recoveryError}</p>}

            <button type="submit" className="btn btn-primary" style={{ marginBottom: '12px' }}>
              {language === 'en' ? "Reset Password" : "Reimposta Password"}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => { setIsRecover(false); setRecoveryError(''); setRecoverySuccess(''); }}
            >
              {language === 'en' ? "Back to Login" : "Torna al Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="view-content animate-slide-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '90vh', position: 'relative', width: '100%', maxWidth: '440px', margin: '0 auto', padding: '40px 20px' }}>
      <ThemeLangBar />
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
          🎫 Eventi App
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          {language === 'en' 
            ? "The portal to discover and organize local events" 
            : "Il portale per scoprire e organizzare eventi locali"}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', marginBottom: '24px' }}>
          <button 
            className={`btn btn-small ${isLogin ? 'btn-primary' : ''}`} 
            style={{ flex: 1, background: isLogin ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none' }}
            onClick={() => { setIsLogin(true); setLoginError(''); setRegError(''); }}
          >
            {t('login_btn')}
          </button>
          <button 
            className={`btn btn-small ${!isLogin ? 'btn-primary' : ''}`} 
            style={{ flex: 1, background: !isLogin ? 'var(--gradient-primary)' : 'transparent', boxShadow: 'none' }}
            onClick={() => { setIsLogin(false); setLoginError(''); setRegError(''); }}
          >
            {t('register_btn')}
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Email or Phone" : "Email o Telefono"}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="user@events.com o 3331234567" 
                  value={loginCred}
                  onChange={(e) => setLoginCred(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type={showPass ? "text" : "password"} 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  style={{ paddingLeft: '42px', paddingRight: '40px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => { setIsRecover(true); setLoginError(''); setRegError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
              >
                {language === 'en' ? "Forgot password?" : "Password dimenticata?"}
              </button>
            </div>

            {loginError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', marginBottom: '16px' }}>{loginError}</p>}

            <button type="submit" className="btn btn-primary">
              {t('login_btn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{language === 'en' ? "First Name" : "Nome"}</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={language === 'en' ? "John" : "Mario"} 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{language === 'en' ? "Last Name" : "Cognome"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={language === 'en' ? "Doe" : "Rossi"} 
                  value={regCognome}
                  onChange={(e) => setRegCognome(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="nome@esempio.com" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Mobile Number" : "Numero di Telefono"}</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="3331234567" 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1.2 }}>
                <label className="form-label">{language === 'en' ? "City" : "Comune"}</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={language === 'en' ? "e.g. Milan" : "es. Saronno"} 
                    value={regComune}
                    onChange={(e) => setRegComune(e.target.value)}
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 0.8 }}>
                <label className="form-label">{language === 'en' ? "Region" : "Regione"}</label>
                <select 
                  className="form-input form-select" 
                  value={regRegione}
                  onChange={(e) => setRegRegione(e.target.value)}
                >
                  {regionsList.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Account Type" : "Tipo Account"}</label>
              <select 
                className="form-input form-select" 
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
              >
                <option value="utente">{t('role_user')}</option>
                <option value="organizzatore">{t('role_organizer')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder={language === 'en' ? "Create a secure password" : "Crea una password sicura"} 
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Interests (optional)" : "Interessi (opzionali)"}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {interestsList.map(interest => {
                  const active = regInterests.includes(interest);
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

            {regError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', marginBottom: '16px' }}>{regError}</p>}

            <button type="submit" className="btn btn-primary">
              {language === 'en' ? "Create Account" : "Crea Account"}
            </button>
          </form>
        )}
      </div>

      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

      {/* Test credentials box removed */}
    </div>
  );
}
