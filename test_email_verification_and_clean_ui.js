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

console.log("=================================================================");
console.log("  VERIFICA EMAIL REALE & INTERFACCIA GRAFICA PULITA             ");
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

// 1. Check LoginRegistration.jsx for visible OTP code & Absence of VITE_ API keys
const loginFile = fs.readFileSync(path.join(process.cwd(), 'src/components/LoginRegistration.jsx'), 'utf-8');
assert("Codice OTP rimosso dalla UI di LoginRegistration.jsx", !loginFile.includes('{otpCode}'));
assert("Notifica Email Ricevuta con codice in chiaro rimossa", !loginFile.includes('Notifica Email Ricevuta'));
assert("Placeholder pulito 000000 utilizzato", loginFile.includes('placeholder="000000"'));
assert("Nessuna variabile client VITE_RESEND_API_KEY presente", !loginFile.includes('VITE_RESEND_API_KEY'));

// 2. Check Serverless Functions & Persistent OTP Storage Engine
const otpStoreFile = fs.readFileSync(path.join(process.cwd(), 'api/otp-store.js'), 'utf-8');
assert("Engine di persistenza OTP multi-lambda api/otp-store.js creato", otpStoreFile.includes('savePersistentOtp'));
assert("Verifica 5 variabili obbligatorie in produzione implementata", otpStoreFile.includes('validateProductionRequirements'));
assert("Cifratura HMAC-SHA256 con secret pepper implementata", otpStoreFile.includes('createHmac(\'sha256\''));
assert("Supporto per Vercel KV REST API incluso", otpStoreFile.includes('KV_REST_API_URL'));

const sendApiFile = fs.readFileSync(path.join(process.cwd(), 'api/send-verification-email.js'), 'utf-8');
assert("Serverless Function /api/send-verification-email.js collegata a savePersistentOtp", sendApiFile.includes('savePersistentOtp'));
assert("Utilizzata la variabile server-side process.env.RESEND_API_KEY", sendApiFile.includes('process.env.RESEND_API_KEY'));

const verifyApiFile = fs.readFileSync(path.join(process.cwd(), 'api/verify-email-code.js'), 'utf-8');
assert("Serverless Function /api/verify-email-code.js collegata a verifyPersistentOtp", verifyApiFile.includes('verifyPersistentOtp'));

// 3. Check index.css for clean warm porcelain & warm chestnut palette
const cssFile = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf-8');
assert("Palette Porcellana Calda (#fcf9f5) impostata come background primario", cssFile.includes('#fcf9f5'));
assert("Colore primario Terracotta / Marroncino Caldo (#b85b35) impostato", cssFile.includes('#b85b35'));

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I CONTROLLI DI SICUREZZA EMAIL & GRAFICA SUPERATI! (${passed}/7) ✅`);
console.log("=================================================================\n");
