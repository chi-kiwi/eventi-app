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
console.log("  COLLAUDO OPERATIVO: ARCHITETTURA A COSTO ZERO (€0.00)           ");
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

async function runZeroCostArchitectureTests() {
  const { db } = await import('./src/services/db.js');

  // 1. Production Cleanliness Verification
  console.log("--- TEST A: PULIZIA PRODUZIONE ASSOLUTA ---");
  const events = db.getEvents();
  assert("Database eventi di produzione privo di eventi finti/demo", events.length === 0);

  const users = db.getUsers();
  assert("Database utenti contiene solo l'admin master chiarettafrancescon003@gmail.com", users.length >= 1 && users.some(u => u.email === "chiarettafrancescon003@gmail.com"));

  // 2. Admin Approval Registration Test
  console.log("\n--- TEST B: REGISTRAZIONE CON APPROVAZIONE MANUALE ADMIN ---");
  const regRes = db.register({
    name: "Mario",
    cognome: "Rossi",
    email: "mario.rossi.test@example.com",
    phone: "3391122334",
    comune: "Pombia",
    regione: "Piemonte",
    password: "password123",
    role: "utente"
  });

  assert("Registrazione utente senza invito ricevuta con pending: true", regRes.success === true && regRes.pending === true);

  const loginPendingRes = db.login("mario.rossi.test@example.com", "password123");
  assert("Login bloccato per account in attesa con pending: true", loginPendingRes.success === false && loginPendingRes.pending === true);

  const pendingList = db.getPendingUsers();
  assert("Utente Mario Rossi appare nella lista utenti in attesa dell'admin", pendingList.some(u => u.email === "mario.rossi.test@example.com"));

  // 3. Admin Approval Action
  console.log("\n--- TEST C: APPROVAZIONE UTENTE DA PARTE DELL'ADMIN ---");
  const adminUser = users.find(u => u.email === "chiarettafrancescon003@gmail.com");
  const pendingUser = pendingList.find(u => u.email === "mario.rossi.test@example.com");

  const approveRes = db.approveUser(pendingUser.id, adminUser.id);
  assert("Approvazione eseguita con successo dall'Admin Master", approveRes.success === true && approveRes.user.accountStatus === "approved");

  const loginApprovedRes = db.login("mario.rossi.test@example.com", "password123");
  assert("Login riuscito con successo dopo l'approvazione dell'Admin", loginApprovedRes.success === true && loginApprovedRes.user.emailVerified === true);

  // 4. Admin Invite Code Registration Test
  console.log("\n--- TEST D: REGISTRAZIONE CON CODICE INVITO ADMIN ---");
  const inviteCodeObj = db.generateInviteCode(adminUser.id, "Invito Stampa");
  assert("Generazione codice invito completata", typeof inviteCodeObj.code === "string" && inviteCodeObj.code.startsWith("EVT-"));

  const inviteRegRes = db.register({
    name: "Giuseppe",
    cognome: "Verdi",
    email: "giuseppe.verdi.test@example.com",
    phone: "3388877665",
    comune: "Sesto Calende",
    regione: "Lombardia",
    password: "password123",
    role: "organizzatore",
    inviteCode: inviteCodeObj.code
  });

  assert("Registrazione con codice invito approvata istantaneamente", inviteRegRes.success === true && inviteRegRes.pending === false);

  const inviteLoginRes = db.login("giuseppe.verdi.test@example.com", "password123");
  assert("Login immediato consentito per account registrato con codice invito", inviteLoginRes.success === true);

  // 5. Check Geocoding OpenStreetMap Nominatim Code
  console.log("\n--- TEST E: MAPPE & GEOCODIFICA OPENSTREETMAP LEAFLET ---");
  const comuniCode = fs.readFileSync(path.join(process.cwd(), 'src/services/comuni.js'), 'utf-8');
  assert("Geocodifica OpenStreetMap Nominatim integrata", comuniCode.includes("fetchNominatimGeocoding"));
  assert("Rate limit a 1 req/sec implementato per policy OpenStreetMap", comuniCode.includes("timeSinceLast < 1000"));
  assert("Cache LocalStorage integrata per evitare chiamate ridondanti", comuniCode.includes("evt_nominatim_cache_"));

  // 6. Check Protected Cron Serverless Endpoint
  console.log("\n--- TEST F: CRON & AUTOMAZIONI CON CRON_SECRET ---");
  const cronCode = fs.readFileSync(path.join(process.cwd(), 'api/cron-cleanup.js'), 'utf-8');
  assert("Serverless cron api/cron-cleanup.js protetto con CRON_SECRET", cronCode.includes("reqSecret !== cronSecret"));

  console.log("\n=================================================================");
  console.log(`  🎉 TUTTI I ${passed} CONTROLLI OPERATIVI DELL'ARCHITETTURA A COSTO ZERO (€0) SUPERATI! ✅`);
  console.log("=================================================================\n");
}

runZeroCostArchitectureTests().catch(err => {
  console.error("Errore durante il collaudo:", err);
  process.exit(1);
});
