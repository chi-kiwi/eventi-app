// Polyfill localStorage & BroadcastChannel for Node test runner
if (typeof global.localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

class MockBroadcastChannel {
  constructor(name) { this.name = name; }
  postMessage() {}
}
global.BroadcastChannel = MockBroadcastChannel;

const { db } = await import('./src/services/db.js?v=test_comm');

console.log("=================================================================");
console.log("  COLLAUDO APPROFONDITO CHAT COMMUNITY (ORGANIZZATORE & PARTECIPANTE)");
console.log("=================================================================\n");

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    console.log(`✅ TEST ${total}: ${msg}`);
    passed++;
  } else {
    console.error(`❌ TEST ${total} FALLITO: ${msg}`);
    process.exit(1);
  }
}

// 1. Setup Organizer & Participant users
const users = db.getUsers();
const organizer = users.find(u => u.role === 'organizzatore') || users[0];
const participant = users.find(u => u.role === 'utente') || users[1];

assert(organizer && participant, "Utente Organizzatore e Partecipante recuperati dal DB");

// 2. Setup an Event
const events = db.getEvents();
let testEvent = events.find(e => e.organizerId === organizer.id);
if (!testEvent) {
  const newEvt = db.createEvent({
    title: "Sagra del Fungo Porcino",
    desc: "Grande festa con degustazioni e musica dal vivo.",
    date: "2026-08-20",
    time: "19:00",
    location: "Piazza Garibaldi, Comignago (NO)",
    gps: { lat: 45.7166, lng: 8.5605 },
    category: "Street food",
    cost: "Gratuito",
    maxCapacity: 100,
    organizerId: organizer.id
  }, organizer.id);
  testEvent = newEvt.event;
}

assert(testEvent && testEvent.id, `Evento di prova valido disponibile: "${testEvent.title}" (ID: ${testEvent.id})`);

// 3. PARTECIPANTE SCRIVE SULLA BACHECA COMMUNITY
const pMsgRes = db.addCommunityMessage(
  testEvent.id, 
  participant.id, 
  `${participant.name} ${participant.cognome}`, 
  participant.avatar || "", 
  "Ciao! Volevo sapere se la cucina offre anche opzioni per celiaci?"
);
assert(pMsgRes.success && pMsgRes.message.text.includes("celiaci"), "Partecipante invia messaggio sulla bacheca community");

// 4. VERIFICA ASSEGNAZIONE XP AL PARTECIPANTE (+2 XP)
const updatedParticipant = db.getUsers().find(u => u.id === participant.id);
assert(updatedParticipant.points >= 2, "Assegnazione XP per contributo bacheca riuscita al partecipante");

// 5. ORGANIZZATORE RISPONDE SULLA BACHECA COMMUNITY
const oMsgRes = db.addCommunityMessage(
  testEvent.id, 
  organizer.id, 
  `${organizer.name} ${organizer.cognome}`, 
  organizer.avatar || "", 
  "Ciao! Certamente, avremo uno stand dedicato 100% gluten-free gestito da personale qualificato!"
);
assert(oMsgRes.success && oMsgRes.message.text.includes("gluten-free"), "Organizzatore risponde ufficialmente sulla bacheca community");

// 6. RECUPERO MESSAGGI E VERIFICA ISOLAMENTO ED ORDINAMENTO CRONOLOGICO
const commMsgs = db.getCommunityMessages(testEvent.id);
assert(commMsgs.length >= 2, "Recupero messaggi bacheca per l'evento corretto");
assert(commMsgs[commMsgs.length - 2].userId === participant.id, "Il messaggio del partecipante precede la risposta dell'organizzatore");
assert(commMsgs[commMsgs.length - 1].userId === organizer.id, "La risposta dell'organizzatore compare in ordine cronologico");

// 7. VERIFICA ELIMINAZIONE MESSAGGIO DA PARTE DELL'ORGANIZZATORE (MODERAZIONE)
const msgToDeleteId = pMsgRes.message.id;
const deleteRes = db.deleteCommunityMessage(testEvent.id, msgToDeleteId, organizer.id);
assert(deleteRes.success, "L'organizzatore ha la facoltà di moderare/eliminare messaggi dalla bacheca del proprio evento");

const msgsAfterDelete = db.getCommunityMessages(testEvent.id);
assert(!msgsAfterDelete.some(m => m.id === msgToDeleteId), "Messaggio eliminato con successo dalla bacheca");

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I ${total} TEST DELLA CHAT COMMUNITY SUPERATI CON SUCCESSO! ✅`);
console.log("=================================================================\n");
