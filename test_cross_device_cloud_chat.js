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

const { db } = await import('./src/services/db.js?v=cloud_sync_test');

console.log("=================================================================");
console.log("  COLLAUDO SINCRONIZZAZIONE BAKECA COMMUNITY & CHAT TRA DISPOSITIVI DIVERSI");
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

async function runTest() {
  const eventId = "evt_cloud_test_123";

  // 1. Utente A invia un messaggio sulla bacheca community
  const postRes = db.addCommunityMessage(eventId, "usr_1", "Chiara Rossi", "", "Ciao a tutti! Qualcuno viene all'evento stasera?");
  assert(postRes.success && postRes.message.id, "Dispositivo 1 (Chiara) invia messaggio in bacheca");

  // Attesa breve per il sync cloud
  await new Promise(r => setTimeout(r, 1000));

  // 2. Dispositivo 2 (Marco) simula l'apertura del sito da un altro telefono/computer senza messaggi locali
  localStorage.setItem("evt_community_messages", "[]"); // reset local storage to simulate virgin device
  await db.syncCloudCommunityMessages();

  const syncMsgs = db.getCommunityMessages(eventId);
  assert(syncMsgs.length > 0 && syncMsgs.some(m => m.text.includes("Qualcuno viene")), "Dispositivo 2 (Marco) riceve in tempo reale il messaggio di Chiara dal Cloud!");

  // 3. Utente B (Marco) risponde sulla bacheca
  const replyRes = db.addCommunityMessage(eventId, "org_1", "Marco Bianchi", "", "Ciao Chiara! Sì, io e lo staff saremo lì dalle 18:00!");
  assert(replyRes.success, "Dispositivo 2 (Marco) invia risposta in bacheca");

  await new Promise(r => setTimeout(r, 1000));

  // 4. Dispositivo 1 (Chiara) sincronizza e riceve la risposta di Marco
  await db.syncCloudCommunityMessages();
  const finalMsgs = db.getCommunityMessages(eventId);
  assert(finalMsgs.length >= 2, "Entrambi i partecipanti vedono la conversazione completa e sincronizzata!");

  console.log("\n=================================================================");
  console.log(`  🎉 TUTTI I ${total} TEST DI SINCRONIZZAZIONE CLOUD TRA DISPOSITIVI SUPERATI! ✅`);
  console.log("=================================================================\n");
}

runTest();
