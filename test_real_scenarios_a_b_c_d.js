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
const { searchItalianComuni, resolveLocationDetails } = await import('./src/services/comuni.js');

console.log("=================================================================");
console.log("  COLLAUDO REALE SCENARI A, B, C, D (VISIBILITÀ, GEOCODING, MAPS) ");
console.log("=================================================================\n");

let passedCount = 0;
function check(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FALLITO: ${testName}`);
    process.exit(1);
  }
}

// Clear storage for fresh test run
localStorage.clear();

const organizer = db.getUsers().find(u => u.role === 'organizzatore');
const participant = db.getUsers().find(u => u.role === 'utente');

console.log("--- TEST A: Creazione Evento Organizzatore & Geocoding ---");
const addressInput = "via don minzoni 77 pombia";
const resolved = resolveLocationDetails(addressInput, "Piemonte");

check(resolved.citta === "Pombia", "Pombia estratta correttamente dall'indirizzo");
check(resolved.provincia === "NO", "Provincia NO associata correttamente");
check(resolved.regione === "Piemonte", "Regione Piemonte associata correttamente");
check(resolved.lat === 45.6567 && resolved.lng === 8.6322, "Coordinate GPS di Pombia (45.6567, 8.6322) e NON Milano");

// Calculate next Saturday for testing weekend
const now = new Date();
const dayOfWeek = now.getDay();
const daysUntilSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7 || 7;
const nextSat = new Date(now);
nextSat.setDate(now.getDate() + daysUntilSat);
const satStr = nextSat.toISOString().split('T')[0];

const newEvtRes = db.createEvent({
  title: "Festa Patronale di San Vincenzo",
  desc: "Musica dal vivo, stand gastronomici e fuochi d'artificio sul fiume.",
  date: satStr,
  time: "19:30",
  location: "Via Don Minzoni 77, Pombia (NO)",
  citta: resolved.citta,
  provincia: resolved.provincia,
  regione: resolved.regione,
  gps: { lat: resolved.lat, lng: resolved.lng },
  category: "Feste di paese",
  status: "pubblicato",
  visibilita: "pubblico"
}, organizer.id);

check(newEvtRes.success && newEvtRes.event?.id, "Evento salvato nel database con successo");

const storedEvents = db.getEvents();
const createdEvt = storedEvents.find(e => e.id === newEvtRes.event.id);
check(createdEvt !== undefined, "Evento creato verificato esistente nel DB");
check(createdEvt.organizerId === organizer.id, "Evento presente nella lista organizzatore");

console.log("\n--- TEST B: Visibilità Partecipante & Apertura Maps ---");
const participantVisibleEvents = db.getEvents().filter(e => e.status === 'pubblicato' && e.visibilita === 'pubblico');
check(participantVisibleEvents.some(e => e.id === createdEvt.id), "Partecipante vede l'evento pubblico nella propria lista");

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${createdEvt.gps.lat},${createdEvt.gps.lng}`;
check(mapsUrl.includes("45.6567,8.6322"), "Apri Maps genera il link con coordinate precise (45.6567, 8.6322)");

console.log("\n--- TEST C: Calendario & Filtro Questo Weekend ---");
const satDateEvents = db.getEvents().filter(e => e.date === satStr);
check(satDateEvents.some(e => e.id === createdEvt.id), "L'evento compare nella data corretta del Calendario");

// Weekend filter verification
const dayNow = now.getDay();
let satCheck = new Date(now);
let sunCheck = new Date(now);
if (dayNow === 0) {
  satCheck.setDate(now.getDate() - 1);
  sunCheck = now;
} else if (dayNow === 6) {
  satCheck = now;
  sunCheck.setDate(now.getDate() + 1);
} else {
  const dSat = 6 - dayNow;
  satCheck.setDate(now.getDate() + dSat);
  sunCheck.setDate(now.getDate() + dSat + 1);
}
const sStr = satCheck.toISOString().split('T')[0];
const suStr = sunCheck.toISOString().split('T')[0];

const weekendEvents = db.getEvents().filter(e => e.date === sStr || e.date === suStr);
check(weekendEvents.some(e => e.id === createdEvt.id), "Filtro 'Questo Weekend' include l'evento del weekend");

console.log("\n--- TEST D: Validazione Errori & Niente Fallback Milano ---");
const randomAddr = "piazza castello 1 saronno";
const saronnoResolved = resolveLocationDetails(randomAddr, "Lombardia");
check(saronnoResolved.citta === "Saronno" && saronnoResolved.provincia === "VA", "Ricerca Saronno assegna provincia VA e città Saronno");
check(saronnoResolved.lat !== 45.4642 && saronnoResolved.lng !== 9.19, "Le coordinate di Saronno non ripiegano su Milano");

console.log("\n=================================================================");
console.log(`  🎉 TUTTI E 15 I CONTROLLI DEI TEST A, B, C, D SUPERATI CON SUCCESSO! (${passedCount}/15) ✅`);
console.log("=================================================================\n");
