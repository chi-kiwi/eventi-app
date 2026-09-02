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

const { db } = await import('./src/services/db.js');

console.log("=================================================================");
console.log("  COLLAUDO COLLAUDATO: PULIZIA PRODUZIONE & DATABASE PERSISTENZA   ");
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

// TEST A — Produzione pulita
console.log("--- TEST A: Produzione Pulita ---");
const users = db.getUsers();
const mockUsers = users.filter(u => u.id === 'usr_1' || u.id === 'col_1' || u.email === 'user@events.com');
assert("Nessun account finto/demo presente nel database", mockUsers.length === 0);

const events = db.getEvents();
const mockEvents = events.filter(e => e.isDemo || e.title?.toLowerCase().includes("sagra della zucca"));
assert("Nessun evento finto/demo nel feed di produzione", mockEvents.length === 0);

// TEST B — LocalStorage Reset
console.log("\n--- TEST B: Resettaggio LocalStorage ---");
localStorage.clear();
db.init(); // re-initialize
const postUsers = db.getUsers();
const postMockUsers = postUsers.filter(u => u.id === 'usr_1' || u.id === 'col_1');
assert("Il reset di localStorage NON rigenera utenti finti o demo", postMockUsers.length === 0);


// TEST C — Creazione Evento Reale Autorizzato
console.log("\n--- TEST C: Primo Evento Reale ---");
const realOrganizer = db.getUsers().find(u => u.role === 'admin' || u.role === 'organizzatore');
assert("Account organizzatore reale verificato (Chiara Francescon)", !!realOrganizer && realOrganizer.email === "chiarettafrancescon003@gmail.com");

const newRealEvt = db.createEvent({
  title: "Gran Galà dell'Olio Nuove Produzioni",
  desc: "Esposizione e degustazione oli locali ed eccellenze territoriali.",
  date: "2026-11-28",
  time: "18:30",
  location: "Comignago, NO",
  citta: "Comignago",
  provincia: "Novara",
  regione: "Piemonte",
  gps: { lat: 45.7167, lng: 8.5667 },
  precisionLevel: "city",
  status: "pubblicato"
}, realOrganizer.id);

assert("Creazione primo evento reale completata", newRealEvt.success);

const freshEvents = db.getEvents();
const createdEvt = freshEvents.find(e => e.id === newRealEvt.event.id);
assert("L'evento reale è persistito ed è accessibile a tutti i browser", !!createdEvt && createdEvt.title === "Gran Galà dell'Olio Nuove Produzioni");


// TEST D — Elenco Utenti Pulito
console.log("\n--- TEST D: Verifica Elenco Account Pulito ---");
const finalUsers = db.getUsers();
const hasOnlyRealAdmins = finalUsers.every(u => u.email === "chiarettafrancescon003@gmail.com" || u.role !== "admin");
assert("L'elenco degli utenti contiene solo account autorizzati", hasOnlyRealAdmins && finalUsers.length >= 1);

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I CONTROLLI DI PULIZIA PRODUZIONE SUPERATI! (${passed}/7) ✅`);
console.log("=================================================================\n");
