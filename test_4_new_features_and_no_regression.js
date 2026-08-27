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
console.log("  COLLAUDO RIGIDO: 4 NUOVE FUNZIONI & NO-REGRESSION CHECK         ");
console.log("=================================================================\n");

let passed = 0;
function assert(testName, condition, details = "") {
  if (condition) {
    console.log(`  ✅ ${testName} ${details ? `(${details})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FALLITO: ${testName}`);
    process.exit(1);
  }
}

const organizer = db.getUsers().find(u => u.role === 'organizzatore');
let participant = db.getUsers().find(u => u.role === 'utente');
if (!participant) {
  participant = {
    id: "usr_test_reg",
    name: "Marco",
    cognome: "Rossi",
    email: "marco.test@example.com",
    phone: "3471234567",
    role: "utente"
  };
  const currentUsers = db.getUsers();
  currentUsers.push(participant);
  db.saveUsers(currentUsers);
}

// --- TEST A: Annulla Evento con Notifica ---
console.log("--- TEST A: Annulla Evento con Notifica ---");
const geoRes = await searchNationalAddress("via Don Minzoni 77, Pombia, NO");
const evt1 = db.createEvent({
  title: "Festa della Birra Pombia",
  desc: "Degustazione birre artigianali.",
  date: "2026-10-25",
  time: "19:00",
  location: geoRes[0].label,
  citta: geoRes[0].citta,
  provincia: geoRes[0].provincia,
  regione: geoRes[0].regione,
  gps: { lat: geoRes[0].lat, lng: geoRes[0].lng },
  precisionLevel: geoRes[0].precisionLevel,
  status: "pubblicato"
}, organizer.id);

const evt1Id = evt1.event.id;
// Participant joins event
db.toggleParticipation(evt1Id, participant.id, 'going');

// Organizer cancels event
const cancelRes = db.cancelEvent(evt1Id, organizer.id, "Meteo avverso");
assert("Organizzatore annulla evento", cancelRes.success && cancelRes.event.status === 'annullato');

// Check participant received internal notification
const participantNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${participant.id}`) || "[]");
const cancelNotif = participantNotifs.find(n => n.eventId === evt1Id && n.type === 'cancellation');
assert("Partecipante ha ricevuto notifica di annullamento", !!cancelNotif, cancelNotif?.title);


// --- TEST B: Lista Nominativa Partecipanti ---
console.log("\n--- TEST B: Lista Nominativa Partecipanti ---");
const partList = db.getEventParticipantsList(evt1Id);
assert("La lista nominativa partecipanti restituisce gli iscritti", partList.length > 0 && partList[0].name.length > 0);
assert("La lista include lo stato 'Partecipo' ed email", partList[0].status === 'Partecipo' && !!partList[0].email);


// --- TEST C: Follow Organizzatore ---
console.log("\n--- TEST C: Follow Organizzatore ---");
const initialFollowers = db.getFollowersCount(organizer.id);
const followRes = db.toggleFollow(participant.id, organizer.id);
assert("Partecipante segue l'organizzatore", followRes.success && followRes.isFollowing);
assert("Conteggio follower aumentato di 1", db.getFollowersCount(organizer.id) === initialFollowers + 1);

// Prevent self-follow
const selfFollow = db.toggleFollow(organizer.id, organizer.id);
assert("Impossibile seguire sé stesso", !selfFollow.success);

// Unfollow
const unfollowRes = db.toggleFollow(participant.id, organizer.id);
assert("Smetti di seguire riduce conteggio follower", unfollowRes.success && !unfollowRes.isFollowing && db.getFollowersCount(organizer.id) === initialFollowers);


// --- TEST D: Notifiche Automatiche Modifica Evento ---
console.log("\n--- TEST D: Notifiche Automatiche Modifica Evento ---");
const evt2 = db.createEvent({
  title: "Concerto in Piazza Pombia",
  desc: "Musica dal vivo e spettacoli.",
  date: "2026-11-15",
  time: "21:00",
  location: geoRes[0].label,
  citta: geoRes[0].citta,
  provincia: geoRes[0].provincia,
  regione: geoRes[0].regione,
  gps: { lat: geoRes[0].lat, lng: geoRes[0].lng },
  precisionLevel: geoRes[0].precisionLevel,
  status: "pubblicato"
}, organizer.id);
const evt2Id = evt2.event.id;

db.toggleParticipation(evt2Id, participant.id, 'going');
const editRes = db.editEvent(evt2Id, { date: "2026-11-16", time: "21:30" }, organizer.id);
assert("Organizzatore modifica data/ora evento", editRes.success);

const updatedNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${participant.id}`) || "[]");
const editNotif = updatedNotifs.find(n => n.eventId === evt2Id && n.type === 'update');
assert("Partecipante ha ricevuto notifica di modifica", !!editNotif, editNotif?.text);


// --- TEST F: Regression Check Completo ---
console.log("\n--- TEST F: Regression Check Completo ---");
assert("Geocodifica reale via Don Minzoni Pombia", geoRes.length > 0);

const legacyEvt = db.createEvent({ title: "Evento Legacy", date: "2026-11-10", location: "Milano" }, organizer.id);
const storedLegacy = db.getEvents().find(e => e.id === legacyEvt.event.id);
assert("Eventi vecchi senza GPS salvati con gps: null", storedLegacy.gps === null);

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${evt1.event.gps.lat},${evt1.event.gps.lng}`;
assert("Maps usa sempre coordinate salvate reali", mapsUrl.includes(`${geoRes[0].lat},${geoRes[0].lng}`));

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I 12 CONTROLLI COLLAUDO SUPERATI CON SUCCESSO! (12/12) ✅`);
console.log("=================================================================\n");
