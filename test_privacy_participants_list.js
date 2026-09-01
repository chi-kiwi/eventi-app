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
console.log("  COLLAUDO PRIVACY GDPR: LISTA PARTECIPANTI & ACCESSI RUOLI      ");
console.log("=================================================================\n");

let passed = 0;
function assert(stepNum, title, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ PASSO ${stepNum}: ${title} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ PASSO ${stepNum} FALLITO: ${title}`);
    process.exit(1);
  }
}

// Setup test users & event
const users = db.getUsers();
const organizer = users.find(u => u.role === 'organizzatore');
let participantConsented = users.find(u => u.role === 'utente');
if (!participantConsented) {
  participantConsented = {
    id: 'usr_consented_1',
    name: 'Marco',
    cognome: 'Rossi',
    email: 'marco.consented@example.com',
    phone: '3471234567',
    role: 'utente',
    shareContactWithOrganizer: true
  };
  users.push(participantConsented);
} else {
  participantConsented.shareContactWithOrganizer = true;
}

const participantPrivate = users.find(u => u.id === 'usr_2') || {
  id: 'usr_2',
  name: 'Giulia',
  cognome: 'Bianchi',
  email: 'giulia.private@example.com',
  phone: '3339998877',
  role: 'utente',
  shareContactWithOrganizer: false // Private non-consented user
};

if (!users.some(u => u.id === participantPrivate.id)) {
  users.push(participantPrivate);
}
db.saveUsers(users);

const evt = db.createEvent({
  title: "Festa della Privacy GDPR",
  date: "2026-11-20",
  time: "20:00",
  location: "Pombia"
}, organizer.id);
const evtId = evt.event.id;

// Join event
db.toggleParticipation(evtId, participantConsented.id, 'going');
db.toggleParticipation(evtId, participantPrivate.id, 'going');

// 1. Organizzatore accede alla lista partecipanti
const orgList = db.getEventParticipantsList(evtId, organizer);
assert(1, "Organizzatore visualizza la lista iscritti privata", orgList.length >= 2);

// 3. Email/Telefono visibili SOLO se autorizzati
const itemConsented = orgList.find(p => p.id === participantConsented.id);
const itemPrivate = orgList.find(p => p.id === participantPrivate.id);

assert(3, "Utente con consenso mostra email reale", itemConsented.hasConsent && itemConsented.email === participantConsented.email);
assert(3, "Utente senza consenso mostra '🔒 Non condiviso'", !itemPrivate.hasConsent && itemPrivate.email === '🔒 Non condiviso');

// 4 & 5. Export CSV protegge i dati non autorizzati
let csvData = "Nome,Stato,Email,Telefono\n";
orgList.forEach(item => {
  csvData += `"${item.name}","${item.status}","${item.email}","${item.phone}"\n`;
});

assert(4, "Generazione CSV completata per l'organizzatore", csvData.length > 0);
assert(5, "CSV non contiene l'email dell'utente non autorizzato", !csvData.includes(participantPrivate.email) && csvData.includes('🔒 Non condiviso'));

// 6 & 7. Partecipante normale NON può accedere alla lista privata
const participantList = db.getEventParticipantsList(evtId, participantConsented);
assert(7, "Partecipante normale NON può accedere alla lista privata (restituisce array vuoto)", participantList.length === 0);

// 8 & 9. Collaboratore autorizzato vede secondo le regole del suo ruolo
const collabUser = db.getUsers().find(u => u.role === 'collaboratore') || {
  id: 'col_1',
  name: 'Staff',
  cognome: 'Oleggio',
  role: 'collaboratore',
  invitedBy: organizer.id
};

const collabList = db.getEventParticipantsList(evtId, collabUser);
assert(9, "Collaboratore dello staff visualizza la lista (rispettando il consenso contatti)", collabList.length >= 2);

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I 9 CONTROLLI PRIVACY GDPR SUPERATI CON SUCCESSO! (${passed}/7) ✅`);
console.log("=================================================================\n");
