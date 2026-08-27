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
console.log("  COLLAUDO OBBLIGATORIO TEST A, B, C (CALENDARIO & ALERT VICINI)  ");
console.log("=================================================================\n");

let passed = 0;
function check(condition, desc) {
  if (condition) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FALLITO: ${desc}`);
    process.exit(1);
  }
}

const organizer = db.getUsers().find(u => u.role === 'organizzatore');
const participant = db.getUsers().find(u => u.role === 'utente');

// -----------------------------------------------------------------
// TEST A — CALENDARIO PARTECIPANTE
// -----------------------------------------------------------------
console.log("--- TEST A: Calendario Partecipante (Solo Eventi Confermati) ---");
const publicEvtRes = db.createEvent({
  title: "Festa Patronale di Prova",
  desc: "Festa per test calendario partecipante",
  date: "2026-10-05",
  time: "18:00",
  location: "Via Roma 10, Pombia (NO)",
  citta: "Pombia",
  provincia: "NO",
  regione: "Piemonte",
  gps: { lat: 45.6567, lng: 8.6322 },
  status: "pubblicato",
  visibilita: "pubblico"
}, organizer.id);

const evtId = publicEvtRes.event.id;

// 1. Participant calendar initially empty if not registered
const eventsBefore = db.getEvents();
const participantCalBefore = eventsBefore.filter(e => 
  e.goingUsers?.includes(participant.id) || e.interestedUsers?.includes(participant.id)
);
check(!participantCalBefore.some(e => e.id === evtId), "Il calendario partecipante NON mostra automaticamente gli eventi pubblici non confermati");

// 2. Participant clicks "Partecipo"
db.toggleParticipation(evtId, participant.id, 'going');
const eventsGoing = db.getEvents();
const participantCalGoing = eventsGoing.filter(e => e.goingUsers?.includes(participant.id));
check(participantCalGoing.some(e => e.id === evtId), "L'evento entra nel calendario partecipante dopo il click 'Partecipo'");

// 3. Participant cancels participation
db.toggleParticipation(evtId, participant.id, 'going');
const eventsCancelled = db.getEvents();
const participantCalAfter = eventsCancelled.filter(e => e.goingUsers?.includes(participant.id));
check(!participantCalAfter.some(e => e.id === evtId), "L'evento sparisce dal calendario partecipante dopo l'annullamento della partecipazione");

// -----------------------------------------------------------------
// TEST B — CALENDARIO ORGANIZZATORE
// -----------------------------------------------------------------
console.log("\n--- TEST B: Calendario Organizzatore (Tutti gli Eventi Creati) ---");
const orgDraftRes = db.createEvent({
  title: "Bozza Evento Interno Organizzatore",
  desc: "Bozza per verifica calendario organizzatore",
  date: "2026-10-08",
  time: "21:00",
  location: "Piazza Castello, Novara (NO)",
  citta: "Novara",
  provincia: "NO",
  regione: "Piemonte",
  gps: { lat: 45.4469, lng: 8.6212 },
  status: "bozza",
  visibilita: "privato"
}, organizer.id);

const orgEvents = db.getEvents().filter(e => e.organizerId === organizer.id);
check(orgEvents.some(e => e.id === orgDraftRes.event.id), "Gli eventi creati dall'organizzatore (inclusi i bozza) compaiono nel suo calendario anche senza iscritti");

// -----------------------------------------------------------------
// TEST C — ALERT EVENTI VICINI NELLO STESSO GIORNO (≤ 25 KM)
// -----------------------------------------------------------------
console.log("\n--- TEST C: Alert Eventi Vicini nello Stesso Giorno (≤ 25 km) ---");

// 1. Create Base Event 1 in Pombia on 2026-10-10
const evt1Res = db.createEvent({
  title: "Sagra del Vino Pombia",
  desc: "Primo evento a Pombia",
  date: "2026-10-10",
  time: "19:00",
  location: "Pombia (NO)",
  citta: "Pombia",
  provincia: "NO",
  regione: "Piemonte",
  gps: { lat: 45.6567, lng: 8.6322 },
  status: "pubblicato",
  visibilita: "pubblico"
}, organizer.id);

// 2. Check nearby events for second event in Varallo Pombia (~3 km away) on SAME date 2026-10-10
const nearbySameDay = db.findNearbyEventsOnDate("2026-10-10", 45.6667, 8.6322, 25);
check(nearbySameDay.length > 0, "Rilevato evento vicino entro 25 km nello stesso giorno");
check(nearbySameDay[0].title === "Sagra del Vino Pombia", `Nome evento vicino restituito: "${nearbySameDay[0].title}"`);
check(typeof nearbySameDay[0].distanceKm === 'number' && nearbySameDay[0].distanceKm <= 5.0, `Distanza calcolata con Haversine esatta: ${nearbySameDay[0].distanceKm} km`);

// 3. Check nearby events for event in Milano (~55 km away) on SAME date 2026-10-10
const nearbyFarAway = db.findNearbyEventsOnDate("2026-10-10", 45.4642, 9.1900, 25);
check(nearbyFarAway.length === 0, "Nessun alert generato per eventi nello stesso giorno ma oltre 25 km (Milano ~55 km)");

// 4. Check nearby events for same location in Varallo Pombia on DIFFERENT date 2026-10-15
const nearbyDifferentDate = db.findNearbyEventsOnDate("2026-10-15", 45.6667, 8.6322, 25);
check(nearbyDifferentDate.length === 0, "Nessun alert generato per eventi vicini ma in un giorno diverso");

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I CONTROLLI DEI TEST A, B, C SUPERATI CON SUCCESSO! (${passed}/8) ✅`);
console.log("=================================================================\n");
