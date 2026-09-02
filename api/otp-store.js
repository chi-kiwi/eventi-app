// Server-Side Persistent OTP Storage & HMAC-SHA256 Security Engine
// Multi-lambda server-side persistence using Vercel KV REST API with strict production requirements

import crypto from 'crypto';

export function isProductionEnv() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
}

// Strictly validate mandatory server-side environment variables in production mode
export function validateProductionRequirements() {
  const missing = [];
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!process.env.RESEND_FROM_EMAIL) missing.push('RESEND_FROM_EMAIL');
  if (!process.env.EMAIL_VERIFICATION_SECRET) missing.push('EMAIL_VERIFICATION_SECRET');
  if (!process.env.KV_REST_API_URL) missing.push('KV_REST_API_URL');
  if (!process.env.KV_REST_API_TOKEN) missing.push('KV_REST_API_TOKEN');

  if (isProductionEnv() && missing.length > 0) {
    return {
      valid: false,
      message: `Verifica email non configurata in produzione. Variabili obbligatorie mancanti su Vercel: ${missing.join(', ')}.`
    };
  }

  return { valid: true, missing };
}

function getSecret() {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;
  if (!secret && isProductionEnv()) {
    throw new Error('EMAIL_VERIFICATION_SECRET mancante in produzione');
  }
  return secret || 'eventiapp_secure_server_secret_key_2026';
}

// Compute HMAC-SHA256 hash of (email + OTP code) with server secret pepper
export function computeOtpHash(email, code) {
  const normEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const secret = getSecret();
  return crypto.createHmac('sha256', secret).update(`${normEmail}:${cleanCode}`).digest('hex');
}

let _devLocalMemoryStore = {};

// Fetch all persistent OTP sessions from Vercel KV REST API
async function fetchPersistentSessions() {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    const res = await fetch(`${kvUrl}/get/eventiapp_otp_sessions`, {
      headers: { Authorization: `Bearer ${kvToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    }
  }

  if (isProductionEnv()) {
    throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN non configurati in produzione su Vercel.');
  }

  // Development local runner fallback store
  return _devLocalMemoryStore;
}

// Save persistent OTP sessions to Vercel KV REST API
async function savePersistentSessions(sessions) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    await fetch(`${kvUrl}/set/eventiapp_otp_sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(sessions))
    });
    return;
  }

  if (isProductionEnv()) {
    throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN non configurati in produzione su Vercel.');
  }

  _devLocalMemoryStore = sessions;
}

// Save persistent OTP session across lambda instances
export async function savePersistentOtp(email, code) {
  const guard = validateProductionRequirements();
  if (!guard.valid) {
    throw new Error(guard.message);
  }

  const normEmail = email.trim().toLowerCase();
  const otpHash = computeOtpHash(normEmail, code);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  const sessions = await fetchPersistentSessions();

  // Purge expired sessions automatically
  const now = Date.now();
  Object.keys(sessions).forEach(key => {
    if (sessions[key] && sessions[key].expiresAt < now) {
      delete sessions[key];
    }
  });

  // Session Schema:
  // email, otpHash, expiresAt, attempts, createdAt, verified, purpose
  sessions[normEmail] = {
    email: normEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    createdAt: new Date().toISOString(),
    verified: false,
    purpose: 'email_verification'
  };

  await savePersistentSessions(sessions);
}

// Verify persistent OTP session across lambda instances
export async function verifyPersistentOtp(email, enteredCode) {
  const guard = validateProductionRequirements();
  if (!guard.valid) {
    return {
      success: false,
      verified: false,
      configured: false,
      message: guard.message
    };
  }

  const normEmail = email.trim().toLowerCase();
  const sessions = await fetchPersistentSessions();
  const session = sessions[normEmail];

  if (!session) {
    return {
      success: false,
      verified: false,
      message: 'Nessun codice di verifica attivo trovato per questo indirizzo. Richiedi un nuovo codice.'
    };
  }

  // 1. Check Expiry (10 minutes)
  if (Date.now() > session.expiresAt) {
    delete sessions[normEmail];
    delete _devLocalMemoryStore[normEmail];
    await savePersistentSessions(sessions);
    return {
      success: false,
      verified: false,
      message: 'Il codice di verifica è scaduto (validità 10 minuti). Richiedi un nuovo codice.'
    };
  }

  // 2. Check Max Attempts (5 attempts)
  if (session.attempts >= 5) {
    delete sessions[normEmail];
    delete _devLocalMemoryStore[normEmail];
    await savePersistentSessions(sessions);
    return {
      success: false,
      verified: false,
      message: 'Troppi tentativi errati (massimo 5). Richiedi un nuovo codice di verifica.'
    };
  }

  // 3. Compute HMAC-SHA256 and compare with stored hash
  const computedHash = computeOtpHash(normEmail, enteredCode);

  if (computedHash === session.otpHash) {
    // Verification successful: delete OTP session to prevent replay attacks
    delete sessions[normEmail];
    delete _devLocalMemoryStore[normEmail];
    await savePersistentSessions(sessions);

    return {
      success: true,
      verified: true,
      emailVerifiedAt: new Date().toISOString(),
      message: 'Indirizzo e-mail verificato con successo!'
    };
  } else {
    // Wrong code: increment attempt counter
    session.attempts += 1;
    const remaining = 5 - session.attempts;

    if (session.attempts >= 5) {
      delete sessions[normEmail];
      delete _devLocalMemoryStore[normEmail];
    } else {
      sessions[normEmail] = session;
    }

    await savePersistentSessions(sessions);

    return {
      success: false,
      verified: false,
      message: `Codice di verifica errato. Tentativi rimasti: ${remaining}`
    };
  }
}
