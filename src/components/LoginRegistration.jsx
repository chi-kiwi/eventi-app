import React, { useState } from 'react';
import { Mail, Phone, Lock, User, MapPin, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import { db } from '../services/db';
import LegalModal from './LegalModal';
import { useLanguage } from '../services/i18n.jsx';

export default function LoginRegistration({ onLoginSuccess }) {
  const { language, t } = useLanguage();
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
    const res = db.login(loginCred, loginPass);
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

    // Uniqueness checks in db (just pre-validation)
    const users = db.getUsers();
    if (users.some(u => u.email === regEmail)) {
      setRegError(language === 'en' ? "This email is already registered." : "Questa email è già associata a un altro account.");
      return;
    }
    if (users.some(u => u.phone === regPhone)) {
      setRegError(language === 'en' ? "This phone number is already registered." : "Questo numero di telefono è già associato a un altro account.");
      return;
    }

    const defaultAvatar = regRole === 'organizzatore'
      ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";

    // Trigger verification simulator
    setTempUser({
      name: regName,
      cognome: regCognome,
      email: regEmail,
      phone: regPhone,
      comune: regComune,
      regione: regRegione,
      password: regPass,
      role: regRole,
      interests: regInterests,
      avatar: defaultAvatar
    });
    setVerifyStep(true);
    setOtpSuccess(false);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setOtpError('');
    if (otpCode !== '1234') { // Mock verification code
      setOtpError("Codice errato. Inserisci '1234' per simulare la verifica corretta.");
      return;
    }

    // Verification success: Save user to db
    const res = db.register(tempUser);
    if (res.success) {
      setOtpSuccess(true);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 1500);
    } else {
      setOtpError(res.message);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setRecoveryError('');
    if (recoveryStep === 1) {
      if (!recoveryContact) {
        setRecoveryError("Inserisci email o numero di telefono.");
        return;
      }
      const users = db.getUsers();
      const userExists = users.some(u => u.email === recoveryContact || u.phone === recoveryContact);
      if (!userExists) {
        setRecoveryError("Nessun account associato a questo recapito.");
        return;
      }
      // Advance to step 2
      setRecoveryStep(2);
    } else {
      if (!recoveryOtp || !recoveryNewPass) {
        setRecoveryError("Compila tutti i campi.");
        return;
      }
      if (recoveryOtp !== '1234') {
        setRecoveryError("Codice OTP errato. Usa '1234' per simulare.");
        return;
      }
      const res = db.resetPassword(recoveryContact, recoveryNewPass);
      if (res.success) {
        setRecoverySuccess("Password reimpostata con successo! Verrai reindirizzato al login.");
        setTimeout(() => {
          setIsRecover(false);
          setRecoveryStep(1);
          setRecoverySuccess('');
          setRecoveryContact('');
          setRecoveryOtp('');
          setRecoveryNewPass('');
          setIsLogin(true);
        }, 2000);
      } else {
        setRecoveryError(res.message);
      }
    }
  };

  if (verifyStep) {
    return (
      <div className="view-content animate-slide-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ background: 'var(--gradient-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Mail size={30} color="white" />
          </div>
          
          <h2 style={{ marginBottom: '10px' }}>{language === 'en' ? "Verify your Identity" : "Verifica la tua Identità"}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            {language === 'en' 
              ? `We sent a confirmation code to ${tempUser?.email}. Enter the code to activate your account.` 
              : `Abbiamo inviato un codice di conferma a ${tempUser?.email}. Inserisci il codice per attivare l'account.`}
          </p>

          {otpSuccess ? (
            <div className="animate-fade-in" style={{ color: 'var(--accent-green)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CheckCircle size={40} />
              <p style={{ fontWeight: 600 }}>{language === 'en' ? "Identity verified successfully!" : "Identità Verificata con successo!"}</p>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label">{language === 'en' ? "Confirmation OTP Code" : "Codice OTP di Conferma"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={language === 'en' ? "Enter 1234" : "Inserisci 1234"} 
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: 'bold' }}
                />
              </div>

              {otpError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', margin: '-8px 0 16px' }}>{otpError}</p>}

              <button type="submit" className="btn btn-primary" style={{ marginBottom: '12px' }}>
                {language === 'en' ? "Confirm and Log In" : "Conferma e Accedi"}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-small"
                onClick={() => setVerifyStep(false)}
              >
                {language === 'en' ? "Cancel and Go Back" : "Annulla e Torna Indietro"}
              </button>
            </form>
          )}

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
            {language === 'en' 
              ? "Tip: use simulation code 1234" 
              : "Suggerimento: usa il codice simulatore 1234"} <strong style={{ color: 'var(--accent-primary)' }}>1234</strong>
          </p>
        </div>
      </div>
    );
  }

  if (isRecover) {
    return (
      <div className="view-content animate-slide-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>{language === 'en' ? "Password Recovery" : "Recupero Password"}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
            {recoveryStep === 1 
              ? (language === 'en' ? "Enter your contact details to receive a link or OTP code." : "Inserisci il tuo contatto per ricevere un link o un codice OTP.") 
              : (language === 'en' ? "Enter the received OTP code and your new password." : "Inserisci l'OTP ricevuto e la tua nuova password.")}
          </p>

          {recoverySuccess && (
            <div className="banner" style={{ borderLeft: '4px solid var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)' }}>
              <span style={{ color: 'var(--accent-green)' }}>{recoverySuccess}</span>
            </div>
          )}

          <form onSubmit={handleRecoverySubmit}>
            {recoveryStep === 1 ? (
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
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">{language === 'en' ? "OTP Code (sent via Email/SMS)" : "Codice OTP (inviato via Email/SMS)"}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={language === 'en' ? "Enter 1234" : "Inserisci 1234"} 
                    value={recoveryOtp}
                    onChange={(e) => setRecoveryOtp(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                  />
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
              </>
            )}

            {recoveryError && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', margin: '-8px 0 16px' }}>{recoveryError}</p>}

            <button type="submit" className="btn btn-primary" style={{ marginBottom: '12px' }}>
              {recoveryStep === 1 
                ? (language === 'en' ? "Send OTP Code" : "Invia Codice OTP") 
                : (language === 'en' ? "Reset Password" : "Reimposta Password")}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => { setIsRecover(false); setRecoveryStep(1); setRecoveryError(''); }}
            >
              {language === 'en' ? "Back to Login" : "Torna al Login"}
            </button>
          </form>
          
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px', textAlign: 'center' }}>
            {language === 'en'
              ? "Info: Any registered account accepts OTP 1234"
              : "Info: Qualsiasi recapito esistente accetta l'OTP 1234"} <strong style={{ color: 'var(--accent-primary)' }}>1234</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-content animate-slide-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '90vh' }}>
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
          // LOGIN FORM
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
                  type={showPass ? 'text' : 'password'} 
                  className="form-input" 
                  placeholder={language === 'en' ? "Enter your password" : "Inserisci la password"} 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  style={{ paddingLeft: '42px', paddingRight: '40px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => { setIsRecover(true); setRecoveryError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
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
          // REGISTRATION FORM
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('name')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Mario" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">{t('cognome')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Rossi" 
                  value={regCognome}
                  onChange={(e) => setRegCognome(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="mario.rossi@email.com" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Phone Number" : "Numero di Telefono"}</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="3331234567" 
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1.2 }}>
                <label className="form-label">{language === 'en' ? "City of residence" : "Comune di residenza"}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Milano" 
                  value={regComune}
                  onChange={(e) => setRegComune(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 0.8 }}>
                <label className="form-label">{t('regione')}</label>
                <select 
                  className="form-input form-select"
                  value={regRegione}
                  onChange={(e) => setRegRegione(e.target.value)}
                >
                  {regionsList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{language === 'en' ? "Account Role" : "Ruolo Account"}</label>
              <select 
                className="form-input form-select"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{ fontWeight: '600', color: 'var(--accent-primary)' }}
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
              {language === 'en' ? "Create Account & Send Code" : "Crea Account ed Invia Codice"}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', lineHeight: '1.4' }}>
              {language === 'en' 
                ? <>By registering, you agree to the <span onClick={() => setIsLegalOpen(true)} style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</span> and <span onClick={() => setIsLegalOpen(true)} style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>GDPR Privacy Policy</span>.</>
                : <>Registrandoti, dichiari di accettare i <span onClick={() => setIsLegalOpen(true)} style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Termini di Servizio</span> e la <span onClick={() => setIsLegalOpen(true)} style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy GDPR</span>.</>}
            </p>
          </form>
        )}
      </div>

      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        <p>{language === 'en' ? "Pre-configured test credentials:" : "Credenziali di test pre-configurate:"}</p>
        <p style={{ marginTop: '4px' }}>
          {language === 'en' ? "Attendee" : "Utente"}: <strong style={{ color: 'var(--text-secondary)' }}>user@events.com</strong> / password123
        </p>
        <p>
          {language === 'en' ? "Organizer" : "Organizzatore"}: <strong style={{ color: 'var(--text-secondary)' }}>organizer@events.com</strong> / password123
        </p>
      </div>
    </div>
  );
}
