// Vercel Serverless Function: Secure Server-Side OTP Code Verification
// Verifies persistent HMAC-SHA256 hashed OTP codes across multi-lambda instances.

import { verifyPersistentOtp } from './otp-store.js';

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
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email e codice di verifica sono obbligatori' });
    }

    // Call persistent multi-lambda verification engine
    const result = await verifyPersistentOtp(email, code);

    if (result.success && result.verified) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server durante la verifica del codice.'
    });
  }
}
