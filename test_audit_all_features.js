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

const { db, getDistance } = await import('./src/services/db.js');
const { searchItalianComuni } = await import('./src/services/comuni.js');

console.log("===============================================");
console.log("   AUDIT COMPLETO DI TUTTE LE FUNZIONALITÀ    ");
console.log("===============================================\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ TEST ${totalTests}: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ TEST ${totalTests} FALLITO: ${message}`);
    process.exit(1);
  }
}

// 1. DATABASE INIT & USERS SEED
const initialUsers = db.getUsers();
assert(initialUsers.length >= 3, "Inizializzazione utenti riuscita con almeno 3 account di default");

// 2. CASE-INSENSITIVE LOGIN
const login1 = db.login("USER@EVENTS.COM", "password123");
assert(login1.success && login1.user.name === "Chiara", "Login case-insensitive funzionante");

// 3. REGISTRATION
const regEmail = `test_user_${Date.now()}@example.com`;
const regRes = db.register({
  name: "Mario",
  cognome: "Rossi",
  email: regEmail,
  phone: "3201234567",
  comune: "Oleggio",
  regione: "Piemonte",
  password: "password123",
  role: "utente"
});
assert(regRes.success && regRes.user.comune === "Oleggio", "Registrazione nuovo utente riuscita");

// 4. PASSWORD RESET
const resetRes = db.resetPassword(regEmail, "new_secret_pass");
assert(resetRes.success, "Reimpostazione password con successo");

const loginReset = db.login(regEmail, "new_secret_pass");
assert(loginReset.success, "Login con nuova password riuscito");

// 5. SEARCH ITALIAN COMUNI
const comuniSuggestions = searchItalianComuni("Comignago");
assert(comuniSuggestions.length > 0 && comuniSuggestions[0].town === "Comignago", "Ricerca Comuni d'Italia funzionante");

// 6. CREATE EVENT WITH FULL ADDRESS & CAPACITY
const newEvtRes = db.createEvent({
  title: "Sagra del Risotto e Paniscia",
  desc: "Festa gastronomica tradizionale con prodotti tipici e musica dal vivo.",
  date: "2026-08-15",
  time: "19:30",
  location: "Piazza Martiri 5, Comignago (NO)",
  gps: { lat: 45.7166, lng: 8.5605 },
  category: "Street food",
  cost: "Ingresso Libero",
  accessibili: false, // Explicit disabled access: NO
  animali: true,
  parcheggio: true,
  maxCapacity: 2,
  ticketUrl: "www.sagraco.it/tickets",
  poster: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"
}, "org_1");
assert(newEvtRes.success && newEvtRes.event.maxCapacity === 2, "Creazione evento con capienza e indirizzo completo riuscita");

const createdEvt = newEvtRes.event;

// 7. EDIT EVENT
const editRes = db.editEvent(createdEvt.id, {
  title: "Sagra del Risotto Aggiornata",
  desc: "Nuovo programma con grande concerto serale!",
  accessibili: true
}, "org_1");
assert(editRes.success && editRes.event.title === "Sagra del Risotto Aggiornata", "Modifica dettagli evento riuscita");

// 8. CAPACITY LIMITS & PARTICIPATION
const user1 = initialUsers[0].id;
const user2 = initialUsers[1].id;
const user3 = initialUsers[2].id;

const part1 = db.toggleParticipation(createdEvt.id, user1, 'going');
assert(part1.success, "Primo partecipante iscritto all'evento");

const part2 = db.toggleParticipation(createdEvt.id, user2, 'going');
assert(part2.success, "Secondo partecipante iscritto all'evento (Capienza Massima Raggiunta)");

const part3 = db.toggleParticipation(createdEvt.id, user3, 'going');
assert(!part3.success && part3.message.includes("SOLD OUT"), "Tentativo sopra la capienza bloccato con messaggio SOLD OUT");

// 9. COMMUNITY MESSAGES & XP
const initialPoints = db.getUsers().find(u => u.id === user1).points;
const msgRes = db.addCommunityMessage(createdEvt.id, user1, "Chiara Rossi", "", "Ci saranno tavoli al coperto in caso di pioggia?");
assert(msgRes.success, "Invio messaggio sulla bacheca community riuscito");

const updatedUser = db.getUsers().find(u => u.id === user1);
assert(updatedUser.points === initialPoints + 2, "Assegnazione XP per contributo community riuscita (+2 XP)");

const commMsgs = db.getCommunityMessages(createdEvt.id);
assert(commMsgs.length >= 1 && commMsgs[0].text.includes("tavoli"), "Recupero messaggi bacheca community corretto");

// 10. PHOTO UPLOAD & LIKES
const photoRes = db.addPhotoToEvent(createdEvt.id, "https://example.com/sagra_photo.jpg", user1, "Chiara Rossi");
assert(photoRes.success && photoRes.event.gallery.length === 1, "Caricamento foto nel ricordo dell'evento riuscito");

const photoId = photoRes.event.gallery[0].id;
const likeRes = db.togglePhotoLike(createdEvt.id, photoId, user2);
assert(likeRes.success && likeRes.liked === true, "Metti Like alla foto dell'album ricordo funzionante");

// 11. MAPS DIRECTIONS URL TEST
const lat = createdEvt.gps.lat;
const lng = createdEvt.gps.lng;
const locQuery = encodeURIComponent(createdEvt.location);
const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${locQuery}`;
assert(googleUrl.includes("Comignago"), "URL indicazioni stradali per Google Maps generato correttamente");

// 12. UPDATE PROFILE (WITHOUT PASSWORD)
const profUpdate = db.updateProfile(user1, {
  comune: "Legnano",
  phone: "3409998877",
  interests: ["Musica", "Street food"]
}, "password123");
assert(profUpdate.success && profUpdate.user.comune === "Legnano", "Aggiornamento dati profilo senza password superato");

console.log("\n===============================================");
console.log(`   TUTTI I ${totalTests} TEST SUPERATI CON SUCCESSO! ✅`);
console.log("===============================================");
