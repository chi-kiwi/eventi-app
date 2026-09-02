// Vercel Serverless Function: Secure Server-Side Email Verification Sender
// Sends real verification emails via Resend HTTP API whenever all 5 production variables are set.

import { savePersistentOtp, validateProductionRequirements } from './otp-store.js';

// Safe email masking helper for server logs (e.g., u***e@email.it)
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Indirizzo e-mail non valido' });
    }

    const normEmail = email.trim().toLowerCase();
    console.log(`[send-verification-email] Richiesta ricevuta per destinatario: ${maskEmail(normEmail)}`);

    // Strict production environment requirement validation
    const guard = validateProductionRequirements();
    if (!guard.valid) {
      console.warn(`[send-verification-email] Configurazione incompleta su Vercel: ${guard.message}`);
      return res.status(500).json({
        success: false,
        configured: false,
        message: guard.message
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'EventiApp <noreply@eventiapp.com>';

    // Generate random 6-digit OTP code server-side
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP session across all serverless lambda instances (HMAC-SHA256 encrypted pepper)
    await savePersistentOtp(normEmail, otpCode);
    console.log(`[send-verification-email] Sessione OTP salvata in Vercel KV per destinatario: ${maskEmail(normEmail)}`);

    const emailSubject = `EventiApp – Codice di verifica indirizzo e-mail`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #b85b35; margin-top: 0;">EventiApp 🎟️</h2>
        <p style="font-size: 14px; color: #475569;">Ciao,</p>
        <p style="font-size: 14px; color: #475569;">Inserisci il seguente codice a 6 cifre per completare la verifica del tuo indirizzo email:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2a201c; background-color: #fcf9f5; padding: 12px 24px; border-radius: 8px; border: 1px solid #e8dcd5; display: inline-block;">${otpCode}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">Il codice ha una validità di 10 minuti. Se non hai richiesto tu questa verifica, ignora questa email.</p>
      </div>
    `;

    // Call Resend Server-Side HTTP API securely
    console.log(`[send-verification-email] Chiamata API Resend per ${maskEmail(normEmail)} via mittente ${fromEmail}...`);
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [normEmail],
        subject: emailSubject,
        html: emailHtml
      })
    });

    const resendData = await resendResponse.json().catch(() => ({}));
    console.log(`[send-verification-email] Risposta Resend HTTP Status: ${resendResponse.status}`);

    if (resendResponse.ok && resendData.id) {
      console.log(`[send-verification-email] Email inviata con successo via Resend. Message ID: ${resendData.id}`);
      return res.status(200).json({
        success: true,
        configured: true,
        provider: 'Resend',
        messageId: resendData.id,
        message: 'Email di verifica inviata con successo. Controlla la tua casella di posta e la cartella Spam.'
      });
    } else {
      console.error(`[send-verification-email] Errore risposta Resend per ${maskEmail(normEmail)}:`, resendData.message || resendData);
      return res.status(500).json({
        success: false,
        configured: true,
        provider: 'Resend',
        error: resendData,
        message: resendData.message || 'Errore durante l’invio dell’email via Resend. Verificare che il mittente ed il dominio siano autorizzati.'
      });
    }

  } catch (error) {
    console.error(`[send-verification-email] Errore eccezione serverless:`, error.message);
    return res.status(500).json({
      success: false,
      configured: false,
      message: error.message || 'Errore interno del server durante l’invio dell’email.'
    });
  }
}
