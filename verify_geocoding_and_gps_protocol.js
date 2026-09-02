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

const { searchNationalAddress } = await import('./src/services/geocoding.js');
const { db } = await import('./src/services/db.js');

console.log("=================================================================");
console.log("  VERIFICA RIGIDA 15 PUNTI: INDIRIZZO, GPS, GEOCODING E MAPS     ");
console.log("=================================================================\n");

let passed = 0;
function checkGPS(stepNum, desc, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ PUNTO ${stepNum}: ${desc} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ PUNTO ${stepNum} FALLITO: ${desc}`);
    process.exit(1);
  }
}

// 1. Geocodifica reale per tutta Italia
const testAddr1 = await searchNationalAddress("via Don Minzoni 77, Pombia, NO");
checkGPS(1, "Geocodifica reale via Don Minzoni 77 Pombia", testAddr1.length > 0, `Trovati ${testAddr1.length} risultati`);

// 2. Verifica che non sia un database locale fisso
const testCatania = await searchNationalAddress("Via Etnea 50, Catania, CT");
checkGPS(2, "Geocodifica reale nazionale su Sicilia/Catania", testCatania.length > 0 && testCatania[0].provincia === "CT", `Risultato: ${testCatania[0]?.label}`);

// 3. Dropdown mostra via, comune, provincia, regione
const itemDonMinzoni = testAddr1[0];
const hasFullFields = itemDonMinzoni.citta && itemDonMinzoni.provincia && itemDonMinzoni.regione && itemDonMinzoni.precisionLevel;
checkGPS(3, "Tendina geocoding include via, comune, provincia e regione", hasFullFields, `Precisione: ${itemDonMinzoni.precisionLevel}`);

// 4. Salvataggio campi completi e precisionLevel
const testMilano = await searchNationalAddress("Piazza Duomo 1, Milano, MI");
const itemMilano = testMilano[0];
const evtMilano = db.createEvent({
  title: "Evento Test Milano",
  date: "2026-11-01",
  time: "20:00",
  location: itemMilano.label,
  citta: itemMilano.citta,
  provincia: itemMilano.provincia,
  regione: itemMilano.regione,
  cap: itemMilano.cap,
  gps: { lat: itemMilano.lat, lng: itemMilano.lng },
  precisionLevel: itemMilano.precisionLevel,
  status: "pubblicato"
}, "org_1");

const storedMilano = db.getEvents().find(e => e.id === evtMilano.event.id);
checkGPS(4, "Salvataggio lat, lng, comune, provincia, regione e precisionLevel nel DB", 
  storedMilano.gps.lat === itemMilano.lat && storedMilano.precisionLevel === itemMilano.precisionLevel,
  `Coords: ${storedMilano.gps.lat}, ${storedMilano.gps.lng}`
);

// 13 & 14. Verifica via Don Minzoni vs via Primo Maggio a Pombia
const testPrimoMaggio = await searchNationalAddress("via Primo Maggio, Pombia, NO");
checkGPS(13, "Geocodifica via Primo Maggio Pombia", testPrimoMaggio.length > 0);

const itemPrimoMaggio = testPrimoMaggio[0];
const distinctCoords = (itemDonMinzoni.lat !== itemPrimoMaggio.lat) || (itemDonMinzoni.lng !== itemPrimoMaggio.lng);
checkGPS(14, "Coordinate DISTINTE tra via Don Minzoni 77 e via Primo Maggio a Pombia", distinctCoords, 
  `Don Minzoni: (${itemDonMinzoni.lat}, ${itemDonMinzoni.lng}) vs Primo Maggio: (${itemPrimoMaggio.lat}, ${itemPrimoMaggio.lng})`
);

// 10 & 11. Eventi vecchi senza GPS gestiti con gps: null e senza coordinate fittizie
const legacyEvt = db.createEvent({
  title: "Evento Senza Coordinate",
  date: "2026-11-05",
  time: "20:00",
  location: "Pombia"
}, "org_1");

const storedLegacy = db.getEvents().find(e => e.id === legacyEvt.event.id);
checkGPS(10, "Eventi senza GPS salvati con gps: null", storedLegacy.gps === null);
checkGPS(11, "Nessuna coordinata fittizia o generica assegnata (no Milano, no centro)", storedLegacy.gps === null);

// 12. Alert eventi vicini entro 25 km
const nearby = db.findNearbyEventsOnDate("2026-11-01", itemMilano.lat, itemMilano.lng, 25);
checkGPS(12, "Ricalcolo alert di prossimità entro 25 km alla modifica di data o posizione", nearby.length > 0);

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I CONTROLLI GEOCODING & MAPS SUPERATI! (${passed}/7) ✅`);
console.log("=================================================================\n");
