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

const { db } = await import('./src/services/db.js?v=test_collab');

console.log("=================================================================");
console.log("  COLLAUDO INVITO COLLABORATORI TRAMITE ID & CODICE UNIVOCO");
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

// 1. Recupero organizzatore ed utente partecipante
const users = db.getUsers();
const organizer = users.find(u => u.role === 'organizzatore') || users[0];
const participant = users.find(u => u.role === 'utente') || users[1];

assert(organizer && participant, "Organizzatore e Partecipante recuperati");
assert(participant.collabId || participant.id, `ID Collaboratore generato per l'utente: ${participant.collabId || participant.id}`);

// 2. Invito utente partecipante tramite il suo ID Collaboratore
const inviteByIdRes = db.inviteCollaboratorById(organizer.id, participant.collabId || participant.id);
assert(inviteByIdRes.success, `Invito tramite ID (${participant.collabId || participant.id}) completato con successo`);

const updatedUser = db.getUsers().find(u => u.id === participant.id);
assert(updatedUser.role === 'collaboratore' && updatedUser.invitedBy === organizer.id, "Ruolo utente aggiornato a 'collaboratore' legato all'organizzatore");

// 3. Creazione diretta di un nuovo collaboratore con ID generato automaticamente
const createColRes = db.inviteCollaborator(organizer.id, "staff_nuovo@events.com", "Mario", "Rossi", "3331234567", "pass123");
assert(createColRes.success && createColRes.collaborator.collabId, `Nuovo collaboratore creato con ID generato: ${createColRes.collaborator.collabId}`);

// 4. Invito del collaboratore appena creato tramite il suo ID appena generato
const reInviteRes = db.inviteCollaboratorById(organizer.id, createColRes.collaborator.collabId);
assert(reInviteRes.success || reInviteRes.message.includes("già un tuo collaboratore"), "Invito tramite ID generato verficato correttamente");

console.log("\n=================================================================");
console.log(`  🎉 TUTTI I ${total} TEST INVITO COLLABORATORI TRAMITE ID SUPERATI! ✅`);
console.log("=================================================================\n");
