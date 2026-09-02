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
const { searchNationalAddress } = await import('./src/services/geocoding.js');

console.log("=================================================================");
console.log("  COLLAUDO RIGIDO GEOCODING PRECISO PER VIA/CIVICO IN tutta ITALIA");
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
const savedCoordsMap = {};

// Test Case 1 & 2: Two different streets in Pombia MUST have DIFFERENT coordinates!
console.log("--- TEST 1: Pombia - Differenziazione per Via (via Primo Maggio vs via Don Minzoni 77) ---");
const pombiaAddr1 = await searchNationalAddress("via Primo Maggio, Pombia, NO");
const pombiaAddr2 = await searchNationalAddress("via Don Minzoni 77, Pombia, NO");

check(pombiaAddr1.length > 0 && pombiaAddr2.length > 0, "Indirizzi di Pombia trovati dal geocoder");

const match1 = pombiaAddr1[0];
const match2 = pombiaAddr2[0];

check(match1.precisionLevel !== 'city' && match2.precisionLevel !== 'city', "Livello di precisione non è solo 'city'");
check(match1.lat !== match2.lat || match1.lng !== match2.lng, "CONFERMATO: 'via Primo Maggio' e 'via Don Minzoni 77' HANO COORDINATE GPS DIVERSE ED ESATTE!");

// Test Case 3: Milano via Roma 1 (NOT city center 45.4642, 9.1900)
console.log("\n--- TEST 2: Milano - via Roma 1 (Niente centro città 45.4642, 9.1900) ---");
const milanoResults = await searchNationalAddress("via Roma 1, Milano, MI");
check(milanoResults.length > 0, "via Roma 1 Milano trovata");
const milanoMatch = milanoResults[0];
check(milanoMatch.lat !== 45.4642 || milanoMatch.lng !== 9.1900, "Coordinate di via Roma 1 Milano NON sono il centro generico (45.4642, 9.1900)");

// Test Case 4: Torino via Garibaldi 10 (NOT city center 45.0703, 7.6869)
console.log("\n--- TEST 3: Torino - via Garibaldi 10 (Niente centro città 45.0703, 7.6869) ---");
const torinoResults = await searchNationalAddress("via Garibaldi 10, Torino, TO");
check(torinoResults.length > 0, "via Garibaldi 10 Torino trovata");
const torinoMatch = torinoResults[0];
check(torinoMatch.lat !== 45.0703 || torinoMatch.lng !== 7.6869, "Coordinate di via Garibaldi 10 Torino NON sono il centro generico (45.0703, 7.6869)");

// Test Case 5: Roma via Nazionale 100 (NOT city center 41.9028, 12.4964)
console.log("\n--- TEST 4: Roma - via Nazionale 100 (Niente centro città 41.9028, 12.4964) ---");
const romaResults = await searchNationalAddress("via Nazionale 100, Roma, RM");
check(romaResults.length > 0, "via Nazionale 100 Roma trovata");
const romaMatch = romaResults[0];
check(romaMatch.lat !== 41.9028 || romaMatch.lng !== 12.4964, "Coordinate di via Nazionale 100 Roma NON sono il centro generico (41.9028, 12.4964)");

// Test Case 6: Catania via Etnea 50
console.log("\n--- TEST 5: Catania - via Etnea 50 ---");
const cataniaResults = await searchNationalAddress("via Etnea 50, Catania, CT");
check(cataniaResults.length > 0, "via Etnea 50 Catania trovata");
const cataniaMatch = cataniaResults[0];
check(cataniaMatch.lat !== 37.5079 || cataniaMatch.lng !== 15.0830, "Coordinate di via Etnea 50 Catania NON sono il centro generico (37.5079, 15.0830)");

// Verification of DB Saving with precisionLevel
console.log("\n--- TEST 6: Salvataggio nel DB con campo precisionLevel ---");
const evtRes = db.createEvent({
  title: "Evento Test Precisione Elevata",
  desc: "Evento di prova con precisione a livello civico/strada",
  date: "2026-09-30",
  time: "21:00",
  location: match2.label,
  citta: match2.citta,
  provincia: match2.provincia,
  regione: match2.regione,
  cap: match2.cap,
  nazione: "Italia",
  gps: { lat: match2.lat, lng: match2.lng },
  precisionLevel: match2.precisionLevel,
  status: "pubblicato",
  visibilita: "pubblico"
}, organizer.id);

check(evtRes.success && evtRes.event.precisionLevel === match2.precisionLevel, "Evento salvato nel DB con il campo precisionLevel registrato correttamente");

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I CONTROLLI DI GEOCODIFICA PRECISA DI VIA SUPERATI CON SUCCESSO! (${passed}) ✅`);
console.log("=================================================================\n");
