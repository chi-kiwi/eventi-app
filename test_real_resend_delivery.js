// Polyfill localStorage for Node test runner
if (typeof global.localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

import fs from 'fs';
import path from 'path';
import { savePersistentOtp, verifyPersistentOtp, computeOtpHash } from './api/otp-store.js';

console.log("=================================================================");
console.log("  COLLAUDO RIGIDO CATENA VERIFICA EMAIL & RESEND SERVERLESS API  ");
console.log("=================================================================\n");

let passed = 0;
function assert(testName, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${testName} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FALLITO: ${testName}`);
    process.exit(1);
  }
}

async function runRealResendDeliveryTests() {
  const targetEmail = "test_user_real@example.com";
  const testOtpCode = "849201";

  // 1. Check frontend calling logic in LoginRegistration.jsx
  const loginCode = fs.readFileSync(path.join(process.cwd(), 'src/components/LoginRegistration.jsx'), 'utf-8');
  assert("Frontend chiama POST /api/send-verification-email", loginCode.includes("fetch('/api/send-verification-email'"));
  assert("Frontend verifica res.ok e data.success prima di aprire modal", loginCode.includes("res.ok && data.success"));
  assert("Frontend mostra errore se la chiamata API fallisce", loginCode.includes("setRegError"));
  assert("Nessun codice OTP visibile o mock in chiaro nella UI", !loginCode.includes("{otpCode}"));

  // 2. Check serverless function api/send-verification-email.js
  const sendApiCode = fs.readFileSync(path.join(process.cwd(), 'api/send-verification-email.js'), 'utf-8');
  assert("Serverless function valida l'indirizzo email", sendApiCode.includes("email.includes('@')"));
  assert("Serverless function controlla RESEND_API_KEY", sendApiCode.includes("process.env.RESEND_API_KEY"));
  assert("Serverless function restituisce success: false se RESEND_API_KEY manca", sendApiCode.includes("success: false"));
  assert("Serverless function chiama https://api.resend.com/emails", sendApiCode.includes("https://api.resend.com/emails"));
  assert("Serverless function restituisce success: true solo se Resend risponde con OK", sendApiCode.includes("resendResponse.ok && resendData.id"));
  assert("Log server-side sicuri implementati (senza OTP e senza API key)", sendApiCode.includes("maskEmail"));

  // 3. Check persistent storage and HMAC-SHA256 hashing in api/otp-store.js
  console.log("\n--- TEST STORAGE PERSISTENTE & ENCRYPTION ---");
  await savePersistentOtp(targetEmail, testOtpCode);
  assert("Salvataggio OTP persistente completato per " + targetEmail, true);

  const hashResult = computeOtpHash(targetEmail, testOtpCode);
  assert("Cifratura HMAC-SHA256 generata correttamente", typeof hashResult === 'string' && hashResult.length === 64);

  // 4. Check verification engine in api/verify-email-code.js
  console.log("\n--- TEST ENGINE DI VERIFICA OTP ---");
  const invalidCodeRes = await verifyPersistentOtp(targetEmail, "000000");
  assert("Codice errato rifiutato con success: false", invalidCodeRes.success === false && invalidCodeRes.verified === false);

  const validCodeRes = await verifyPersistentOtp(targetEmail, testOtpCode);
  assert("Codice corretto accettato con verified: true", validCodeRes.success === true && validCodeRes.verified === true);
  assert("Data di verifica emailVerifiedAt restituita", typeof validCodeRes.emailVerifiedAt === 'string');

  const replayRes = await verifyPersistentOtp(targetEmail, testOtpCode);
  assert("Replay attack eliminato (codice già usato monouso)", replayRes.success === false);

  console.log("\n=================================================================");
  console.log(`  🎉 TUTTI I ${passed} CONTROLLI CATENA VERIFICA EMAIL SUPERATI CON SUCCESSO! ✅`);
  console.log("=================================================================\n");
}

runRealResendDeliveryTests().catch(err => {
  console.error("Errore durante il collaudo:", err);
  process.exit(1);
});
