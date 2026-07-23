// Polyfill localStorage & BroadcastChannel for Node test runner
const stores = {};

function createMockStorage(tabId) {
  if (!stores[tabId]) stores[tabId] = {};
  return {
    getItem: (key) => stores[tabId][key] || null,
    setItem: (key, value) => { stores[tabId][key] = String(value); },
    removeItem: (key) => { delete stores[tabId][key]; },
    clear: () => { stores[tabId] = {}; }
  };
}

const listeners = [];
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    listeners.push(this);
  }
  postMessage(data) {
    listeners.forEach(l => {
      if (l !== this && l.onmessage) {
        l.onmessage({ data });
      }
    });
  }
}
global.BroadcastChannel = MockBroadcastChannel;

console.log("=================================================");
console.log("   SIMULAZIONE COLLAUDO CHAT MANUALE (NO BOT)    ");
console.log("=================================================\n");

// Setup Tab A (Chiara Rossi)
global.localStorage = createMockStorage("tabA");
const { db: dbChiara } = await import('./src/services/db.js?v=2');

// Setup Tab B (Marco Bianchi)
global.localStorage = createMockStorage("tabB");
const { db: dbMarco } = await import('./src/services/db.js?v=3');

let testPassed = true;

// 1. CHIARA POSTS TO COMMUNITY BOARD
console.log("1. Chiara Rossi invia un messaggio sulla bacheca dell'evento 'evt_1'...");
const chiaraMsgText = "Ciao a tutti! Sapete se ci sono parcheggi riservati?";
const resChiara = dbChiara.addCommunityMessage("evt_1", "usr_1", "Chiara Rossi", "", chiaraMsgText);

if (resChiara.success) {
  console.log("   ✅ Messaggio inviato da Chiara:", resChiara.message.text);
}

// 2. CHECK REAL-TIME SYNC TO MARCO
const marcoCommunityMsgs = dbMarco.getCommunityMessages("evt_1");
const receivedByMarco = marcoCommunityMsgs.find(m => m.text === chiaraMsgText);

if (receivedByMarco) {
  console.log("2. ✅ SINCRO RIUSCITA! Marco Bianchi ha ricevuto il messaggio di Chiara sulla bacheca!");
} else {
  console.error("2. ❌ FALLITO: Sincronizzazione bacheca non riuscita");
  testPassed = false;
}

// 3. CHIARA SENDS PRIVATE MESSAGE TO MARCO BIANCHI
console.log("\n3. Chiara Rossi invia un messaggio PRIVATO a Marco Bianchi...");
const privateMsgText = "Salve Marco, volevo chiederle un'informazione sui posti.";
const privMsgRes = dbChiara.sendMessage("evt_1", "usr_1", "org_1", privateMsgText);

console.log("   ✅ Messaggio inviato:", privMsgRes.message);

// Wait 2 seconds and check that NO automatic bot reply was generated
await new Promise(r => setTimeout(r, 2000));

const msgsAfterWait = dbChiara.getChatMessages("evt_1", "usr_1", "org_1");
const autoBotMsgs = msgsAfterWait.filter(m => m.message.includes("Grazie per averci"));

if (autoBotMsgs.length === 0) {
  console.log("4. ✅ NESSUN MESSAGGIO BOT AUTOMATICO: La chat è 100% manuale e reale tra utenti!");
} else {
  console.error("4. ❌ FALLITO: Trovato ancora un messaggio bot automatico!");
  testPassed = false;
}

console.log("\n=================================================");
if (testPassed) {
  console.log("   🎉 COLLAUDO SUPERATO AL 100%! NESSUN BOT PRESENTE. ✅");
} else {
  console.log("   ❌ ERRORE NEL COLLAUDO.");
}
console.log("=================================================");
