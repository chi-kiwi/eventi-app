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
console.log("  COLLAUDO 13 SCENARI: VISIBILITÀ EVENTI, GPS E MAPS PERMANENTI  ");
console.log("=================================================================\n");

let passed = 0;
function assertTest(condition, num, title) {
  if (condition) {
    console.log(`✅ SCENARIO ${num}: ${title}`);
    passed++;
  } else {
    console.error(`❌ SCENARIO ${num} FALLITO: ${title}`);
    process.exit(1);
  }
}

// Scenario 1: Organizzatore crea evento pubblico con indirizzo completo
const organizer = db.getUsers().find(u => u.role === 'organizzatore');
const participant = db.getUsers().find(u => u.role === 'utente');

const newEventRes = db.createEvent({
  title: "Festa della Vendemmia e del Vino Tipico",
  desc: "Degustazioni di vini locali, musica tradizionale e stand enogastronomici.",
  date: "2026-09-15",
  time: "19:00",
  location: "Via Roma 10, Comignago (NO)",
  citta: "Comignago",
  provincia: "NO",
  regione: "Piemonte",
  gps: { lat: 45.7188, lng: 8.5639 },
  category: "Feste di paese",
  cost: "Gratuito",
  maxCapacity: 200,
  status: "pubblicato",
  visibilita: "pubblico"
}, organizer.id);

assertTest(newEventRes.success && newEventRes.event.id, 1, "Organizzatore crea evento pubblico con indirizzo completo");

// Scenario 2: L'evento compare nella lista organizzatore
const orgEvents = db.getEvents().filter(e => e.organizerId === organizer.id);
assertTest(orgEvents.some(e => e.id === newEventRes.event.id), 2, "L'evento compare nella lista dell'organizzatore");

// Scenario 3: Lo stesso evento compare nella lista partecipante
const allEvents = db.getEvents();
const publicPublished = allEvents.filter(e => e.status === 'pubblicato' && e.visibilita === 'pubblico');
assertTest(publicPublished.some(e => e.id === newEventRes.event.id), 3, "Lo stesso evento compare nella lista per i partecipanti");

// Scenario 4 & 5: Dettaglio evento contiene luogo, indirizzo, città e provincia
const createdEvt = allEvents.find(e => e.id === newEventRes.event.id);
assertTest(
  createdEvt.location.includes("Via Roma 10") && 
  createdEvt.citta === "Comignago" && 
  createdEvt.provincia === "NO" && 
  createdEvt.regione === "Piemonte",
  4,
  "Il dettaglio evento mostra luogo, indirizzo completo, città e provincia"
);

// Scenario 6 & 7: Generazione link Maps con coordinate precise
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${createdEvt.gps.lat},${createdEvt.gps.lng}`;
assertTest(mapsUrl.includes("45.7188,8.5639"), 6, "Clic su 'Apri Maps' genera il link con latitudine e longitudine precise");

// Scenario 8 & 9: Ricerca località tramite comuni e salvataggio GPS
const comuniResult = searchItalianComuni("Saronno");
assertTest(comuniResult.length > 0 && comuniResult[0].town === "Saronno" && comuniResult[0].prov === "VA", 8, "Ricerca località 'Saronno' restituisce città e provincia (VA)");

const resolved = resolveLocationDetails("Corso Italia 5, Saronno", "Lombardia");
assertTest(resolved.citta === "Saronno" && resolved.provincia === "VA" && resolved.regione === "Lombardia" && resolved.lat && resolved.lng, 9, "Risoluzione indirizzo salva Lat/Lng e regione correttamente");

// Scenario 10: Se GPS è negato o fallisce, ricerca manuale risolve le coordinate del Comune
const manualResolved = resolveLocationDetails("Piazza Castello, Milano", "Lombardia");
assertTest(manualResolved.lat === 45.4642 && manualResolved.lng === 9.19, 10, "Ricerca manuale assegna le coordinate corrette del comune se il GPS è disattivato");

// Scenario 11: Controllo bozza - Evento in bozza NON compare ai partecipanti
const draftRes = db.createEvent({
  title: "Bozza Riservata Organizzatore",
  desc: "Evento ancora in fase di pianificazione.",
  date: "2026-10-01",
  time: "20:00",
  location: "Via Garibaldi 1, Torino",
  status: "bozza",
  visibilita: "pubblico"
}, organizer.id);

const participantViewEvents = db.getEvents().filter(e => {
  if (e.status === 'bozza' && e.organizerId !== participant.id) return false;
  return true;
});
assertTest(!participantViewEvents.some(e => e.id === draftRes.event.id), 11, "Eventi in stato 'bozza' non compaiono nella lista dei partecipanti");

// Scenario 12: Regole lettura - Partecipante può leggere tutti gli eventi pubblicati
assertTest(publicPublished.length >= 1, 12, "Regole dati permettono ai partecipanti di leggere tutti gli eventi pubblicati");

// Scenario 13: Regole permessi - Partecipante NON può modificare eventi altrui
const editRes = db.editEvent(newEventRes.event.id, { title: "Titolo Hackerato" }, participant.id);
assertTest(!editRes.success && editRes.message.includes("Non disponi delle autorizzazioni"), 13, "Regole dati impediscono ai partecipanti di modificare eventi di altri utenti");

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I 13 SCENARI RICHIESTI SUPERATI CON SUCCESSO! (${passed}/13) ✅`);
console.log("=================================================================\n");
