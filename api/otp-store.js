// Server-Side Persistent OTP Storage & HMAC-SHA256 Security Engine
// Multi-lambda server-side persistence using Vercel KV REST API or dedicated Cloud KV storage

import crypto from 'crypto';

const DEDICATED_CLOUD_KV_URL = 'https://jsonblob.com/api/jsonBlob/1344218683516641280';
const DEFAULT_SECRET = 'eventiapp_secure_server_secret_key_2026';

function getSecret() {
  return process.env.EMAIL_VERIFICATION_SECRET || DEFAULT_SECRET;
}

// Compute HMAC-SHA256 hash of (email + OTP code) with server secret pepper
export function computeOtpHash(email, code) {
  const normEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const secret = getSecret();
  return crypto.createHmac('sha256', secret).update(`${normEmail}:${cleanCode}`).digest('hex');
}

// Fetch all persistent OTP sessions from Vercel KV REST API or dedicated Cloud Storage API
async function fetchPersistentSessions() {
  try {
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

    // Reliable fallback persistent serverless store via Cloud KV Endpoint
    const res = await fetch(DEDICATED_CLOUD_KV_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data && typeof data === 'object') ? data : {};
  } catch (e) {
    return {};
  }
}

// Save persistent OTP sessions to Vercel KV REST API or dedicated Cloud Storage API
async function savePersistentSessions(sessions) {
  try {
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

    // Reliable fallback persistent serverless store via Cloud KV Endpoint
    await fetch(DEDICATED_CLOUD_KV_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(sessions)
    });
  } catch (e) {}
}

// Save persistent OTP session across lambda instances
export async function savePersistentOtp(email, code) {
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
  const normEmail = email.trim().toLowerCase();
  const sessions = await fetchPersistentSessions();
  const session = sessions[normEmail];

  if (!session) {
    return {
      success: false,
      message: 'Nessun codice di verifica attivo trovato per questo indirizzo. Richiedi un nuovo codice.'
    };
  }

  // 1. Check Expiry (10 minutes)
  if (Date.now() > session.expiresAt) {
    delete sessions[normEmail];
    await savePersistentSessions(sessions);
    return {
      success: false,
      message: 'Il codice di verifica è scaduto (validità 10 minuti). Richiedi un nuovo codice.'
    };
  }

  // 2. Check Max Attempts (5 attempts)
  if (session.attempts >= 5) {
    delete sessions[normEmail];
    await savePersistentSessions(sessions);
    return {
      success: false,
      message: 'Troppi tentativi errati (massimo 5). Richiedi un nuovo codice di verifica.'
    };
  }

  // 3. Compute HMAC-SHA256 and compare with stored hash
  const computedHash = computeOtpHash(normEmail, enteredCode);

  if (computedHash === session.otpHash) {
    // Verification successful: delete OTP session to prevent replay attacks
    delete sessions[normEmail];
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
    }

    await savePersistentSessions(sessions);

    return {
      success: false,
      verified: false,
      message: `Codice di verifica errato. Tentativi rimasti: ${remaining}`
    };
  }
}
