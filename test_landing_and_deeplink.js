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
console.log("  COLLAUDO AGGIORNAMENTO COMPLETO: DELETE, BIO, PASSWORD & SEO  ");
console.log("=================================================================\n");

// Test 1: User Bio Update
const user = db.getUsers().find(u => u.id === 'org_1');
console.log("👤 TEST 1: Utente recuperato per modifica Bio:", user.name, user.cognome);
const bioRes = db.updateUserBio(user.id, "Passione per sagre, concerti dal vivo ed organizzazione di grandi eventi in Piemonte!");
if (bioRes.success && bioRes.user.bio.includes("Passione per sagre")) {
  console.log("✅ TEST 1 SUPERATO: Biografia utente aggiornata e salvata con successo!");
} else {
  console.error("❌ TEST 1 FALLITO:", bioRes.message);
  process.exit(1);
}

// Test 2: Password Reset Request via Email
const resetRes = db.requestPasswordResetEmail("chiara@eventiapp.com");
if (resetRes.success && resetRes.resetCode && resetRes.resetCode.length === 6) {
  console.log("✅ TEST 2 SUPERATO: Richiesta recupero password via email riuscita con codice OTP generato:", resetRes.resetCode);
} else {
  console.error("❌ TEST 2 FALLITO:", resetRes.message);
  process.exit(1);
}

// Test 3: Event Creation and Deletion by Organizer
const newEvtRes = db.createEvent({
  title: "Festa Temporanea da Eliminare",
  desc: "Evento di prova per testare la funzione di eliminazione dell'organizzatore.",
  date: "2026-09-01",
  time: "20:00",
  location: "Piazza Garibaldi, Comignago (NO)",
  gps: { lat: 45.7188, lng: 8.5639 },
  category: "Feste di paese",
  cost: "Gratuito",
  maxCapacity: 100,
  ticketUrl: "",
  accessibili: true,
  animali: true,
  parcheggio: true,
  poster: ""
}, user.id);

if (!newEvtRes.success) {
  console.error("❌ Creazione evento temporaneo fallita");
  process.exit(1);
}
const tempEventId = newEvtRes.event.id;
console.log("🎪 TEST 3: Evento temporaneo creato con ID:", tempEventId);

// Verify event exists
let currentEvents = db.getEvents();
if (!currentEvents.some(e => e.id === tempEventId)) {
  console.error("❌ Evento temporaneo non presente nel DB");
  process.exit(1);
}

// Attempt deletion by authorized organizer
const delRes = db.deleteEvent(tempEventId, user.id);
if (delRes.success) {
  currentEvents = db.getEvents();
  const deletedStillExists = currentEvents.some(e => e.id === tempEventId);
  if (!deletedStillExists) {
    console.log("✅ TEST 3 SUPERATO: Eliminazione evento eseguita con successo! L'evento non compare più nel feed.");
  } else {
    console.error("❌ TEST 3 FALLITO: L'evento risulta ancora presente dopo l'eliminazione.");
    process.exit(1);
  }
} else {
  console.error("❌ TEST 3 FALLITO:", delRes.message);
  process.exit(1);
}

console.log("\n=================================================================");
console.log("  🎉 TUTTI I NUOVI TEST DI OTTIMIZZAZIONE SUPERATI CON SUCCESSO! ✅");
console.log("=================================================================\n");
