// Vercel Serverless Function: SMS OTP Verification Sender via Twilio / SMS Gateway
// Sends real verification codes via SMS to user's mobile phone number

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
    const { phone, email } = req.body || {};
    if (!phone && !email) {
      return res.status(400).json({ success: false, message: 'Telefono o E-mail obbligatorio per l’invio dell’OTP' });
    }

    const cleanPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
    const normEmail = email ? email.trim().toLowerCase() : cleanPhone;

    // Generate random 6-digit OTP server-side
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save persistent OTP session under email / phone key
    await savePersistentOtp(normEmail, otpCode);
    if (cleanPhone && cleanPhone !== normEmail) {
      await savePersistentOtp(cleanPhone, otpCode);
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromPhone = process.env.TWILIO_PHONE_NUMBER;

    // If Twilio credentials are configured, send SMS message via Twilio HTTP API
    if (twilioSid && twilioAuthToken && twilioFromPhone) {
      const formattedToPhone = cleanPhone.startsWith('+') ? cleanPhone : `+39${cleanPhone}`;
      const params = new URLSearchParams();
      params.append('From', twilioFromPhone);
      params.append('To', formattedToPhone);
      params.append('Body', `EventiApp: Il tuo codice di attivazione è ${otpCode}. Scade in 10 minuti.`);

      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (twilioRes.ok) {
        return res.status(200).json({
          success: true,
          smsSent: true,
          message: `SMS con codice OTP inviato con successo al numero ${cleanPhone}.`
        });
      }
    }

    // Default response acknowledging OTP generated and saved for verification
    return res.status(200).json({
      success: true,
      smsSent: false,
      message: `Codice OTP registrato ed in attesa di inserimento per il numero ${cleanPhone}.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante l’invio dell’SMS.'
    });
  }
}
