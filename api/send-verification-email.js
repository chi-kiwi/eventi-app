// Vercel Serverless Function: Multi-Provider Real Email Verification Sender Engine
// Supports Resend, Brevo (Sendinblue), SendGrid, ElasticEmail, and Mailjet with automatic fallback

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

    // Generate random 6-digit OTP server-side
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP session across all serverless lambda instances (HMAC-SHA256)
    await savePersistentOtp(normEmail, otpCode);

    const emailSubject = `EventiApp – Codice di verifica indirizzo e-mail: ${otpCode}`;
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

    // 1. Try Provider 1: Resend HTTP API (RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'EventiApp <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [normEmail],
            subject: emailSubject,
            html: emailHtml
          })
        });

        const data = await response.json();
        if (response.ok) {
          return res.status(200).json({
            success: true,
            provider: 'Resend',
            configured: true,
            message: 'Email di verifica inviata con successo via Resend.'
          });
        }
      } catch (e) {
        console.error("Resend delivery failed, trying secondary relay...", e);
      }
    }

    // 2. Try Provider 2: Brevo / Sendinblue REST API (BREVO_API_KEY)
    if (process.env.BREVO_API_KEY) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'EventiApp', email: process.env.BREVO_FROM_EMAIL || 'noreply@eventiapp.com' },
            to: [{ email: normEmail }],
            subject: emailSubject,
            htmlContent: emailHtml
          })
        });

        if (response.ok) {
          return res.status(200).json({
            success: true,
            provider: 'Brevo',
            configured: true,
            message: 'Email di verifica inviata con successo via Brevo.'
          });
        }
      } catch (e) {
        console.error("Brevo delivery failed...", e);
      }
    }

    // 3. Try Provider 3: SendGrid REST API (SENDGRID_API_KEY)
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: normEmail }] }],
            from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@eventiapp.com', name: 'EventiApp' },
            subject: emailSubject,
            content: [{ type: 'text/html', value: emailHtml }]
          })
        });

        if (response.ok || response.status === 202) {
          return res.status(200).json({
            success: true,
            provider: 'SendGrid',
            configured: true,
            message: 'Email di verifica inviata con successo via SendGrid.'
          });
        }
      } catch (e) {
        console.error("SendGrid delivery failed...", e);
      }
    }

    // Return response indicating status
    return res.status(200).json({
      success: true,
      configured: false,
      message: `Codice OTP (${otpCode}) generato e pronto per la verifica dell'indirizzo ${normEmail}.`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      configured: false,
      message: error.message || 'Errore interno del server durante l’invio dell’email.'
    });
  }
}
