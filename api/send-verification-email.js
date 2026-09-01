// Vercel Serverless Function: Secure Server-Side Email Verification Sender
// Sends real verification emails via Resend HTTP API whenever RESEND_API_KEY is present

import { savePersistentOtp } from './otp-store.js';

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
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Indirizzo e-mail non valido' });
    }

    const normEmail = email.trim().toLowerCase();
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'EventiApp <onboarding@resend.dev>';

    // Generate random 6-digit OTP server-side
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP session across all serverless lambda instances (HMAC-SHA256)
    await savePersistentOtp(normEmail, otpCode);

    // If RESEND_API_KEY is not configured on Vercel environment
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'Invio email non configurato. Imposta la variabile RESEND_API_KEY su Vercel per abilitare la consegna reale delle e-mail.'
      });
    }

    // Call Resend Server-Side HTTP API securely
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [normEmail],
        subject: 'EventiApp – Codice di verifica indirizzo e-mail',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #b85b35; margin-top: 0;">EventiApp</h2>
            <p style="font-size: 14px; color: #475569;">Ciao,</p>
            <p style="font-size: 14px; color: #475569;">Inserisci il seguente codice a 6 cifre per completare la verifica del tuo indirizzo email:</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #2a201c; background-color: #fcf9f5; padding: 12px 24px; border-radius: 8px; border: 1px solid #e8dcd5; display: inline-block;">${otpCode}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">Il codice ha una validità di 10 minuti. Se non hai richiesto tu questa verifica, ignora questa email.</p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        configured: true,
        message: 'Email di verifica inviata con successo.'
      });
    } else {
      return res.status(500).json({
        success: false,
        configured: true,
        message: data.message || 'Errore durante l’invio dell’email via Resend.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      configured: false,
      message: error.message || 'Errore interno del server durante l’invio dell’email.'
    });
  }
}
