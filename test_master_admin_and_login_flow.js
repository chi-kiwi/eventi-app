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

import fs from 'fs';
import path from 'path';

console.log("=================================================================");
console.log("  COLLAUDO LOGICO COMPLETO: ADMIN MASTER & FLUSSO DI LOGIN      ");
console.log("=================================================================\n");

let passed = 0;
function assert(testName, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${testName} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  ❌ FALLITO: ${testName}`);
    process.exit(1);
  }
}

async function runMasterAdminAndLoginFlowTests() {
  const { db } = await import('./src/services/db.js');

  // 1. Master Admin Auto-Healing & Approval Verification
  console.log("--- TEST A: ADMIN MASTER chiarettafrancescon003@gmail.com ---");
  const users = db.getUsers();
  const masterAdmin = users.find(u => u.email === "chiarettafrancescon003@gmail.com");

  assert("Admin Master chiarettafrancescon003@gmail.com presente nel DB", !!masterAdmin);
  assert("Ruolo impostato su 'admin'", masterAdmin.role === "admin");
  assert("accountStatus impostato su 'approved'", masterAdmin.accountStatus === "approved");
  assert("emailVerified impostato su true", masterAdmin.emailVerified === true);

  const adminLoginRes = db.login("chiarettafrancescon003@gmail.com", "password123");
  assert("Login Admin Master consentito senza alcun blocco", adminLoginRes.success === true && adminLoginRes.user.email === "chiarettafrancescon003@gmail.com");

  // 2. Pending User Registration & Exact Login Error Message Test
  console.log("\n--- TEST B: FLUSSO UTENTE IN ATTESA (PENDING) ---");
  const pendingRegRes = db.register({
    name: "Marco",
    cognome: "Test",
    email: "marco.pending@example.com",
    phone: "3311122334",
    comune: "Somma Lombardo",
    regione: "Lombardia",
    password: "password123",
    role: "utente"
  });

  assert("Registrazione utente senza invito ricevuta con pending: true", pendingRegRes.success === true && pendingRegRes.pending === true);

  const pendingLoginRes = db.login("marco.pending@example.com", "password123");
  assert("Login bloccato per account pending con success: false", pendingLoginRes.success === false && pendingLoginRes.pending === true);
  assert("Messaggio esatto per login in attesa", pendingLoginRes.message === "Il tuo account è in attesa di approvazione. Riceverai accesso quando l'amministratore avrà approvato la registrazione.");

  // 3. Rejected User Registration & Exact Login Error Message Test
  console.log("\n--- TEST C: FLUSSO UTENTE RIFIUTATO (REJECTED) ---");
  const pendingUsers = db.getPendingUsers();
  const pendingUser = pendingUsers.find(u => u.email === "marco.pending@example.com");

  db.rejectUser(pendingUser.id, masterAdmin.id);

  const rejectedLoginRes = db.login("marco.pending@example.com", "password123");
  assert("Login bloccato per account rejected con success: false", rejectedLoginRes.success === false && rejectedLoginRes.rejected === true);
  assert("Messaggio esatto per login rifiutato", rejectedLoginRes.message === "La tua richiesta di registrazione non è stata approvata.");

  // 4. Invite Code Approved Registration Test
  console.log("\n--- TEST D: REGISTRAZIONE CON CODICE INVITO & LOGIN APPROVED ---");
  const inviteObj = db.generateInviteCode(masterAdmin.id, "Invito Test Login");
  const inviteRegRes = db.register({
    name: "Anna",
    cognome: "Verdi",
    email: "anna.approved@example.com",
    phone: "3322233445",
    comune: "Arona",
    regione: "Piemonte",
    password: "password123",
    role: "organizzatore",
    inviteCode: inviteObj.code
  });

  assert("Registrazione con codice invito approvata istantaneamente", inviteRegRes.success === true && inviteRegRes.pending === false);

  const approvedLoginRes = db.login("anna.approved@example.com", "password123");
  assert("Login eseguito con successo per utente approvato", approvedLoginRes.success === true && approvedLoginRes.user.email === "anna.approved@example.com");

  // 5. Check LoginRegistration.jsx UI Code
  console.log("\n--- TEST E: VERIFICA CODICE UI DI LOGIN & REGISTRAZIONE ---");
  const uiCode = fs.readFileSync(path.join(process.cwd(), 'src/components/LoginRegistration.jsx'), 'utf-8');
  assert("Placeholder credential login aggiornato a chiarettafrancescon003@gmail.com", uiCode.includes("chiarettafrancescon003@gmail.com"));
  assert("Pulsante Accedi mai disabilitato per l'admin", !uiCode.includes("disabled={isLogin"));
  assert("Messaggio di successo regSuccess gestito nel form di registrazione", uiCode.includes("regSuccess"));

  console.log("\n=================================================================");
  console.log(`  🎉 TUTTI I ${passed} CONTROLLI DEL FLUSSO DI LOGIN & ADMIN MASTER SUPERATI! ✅`);
  console.log("=================================================================\n");
}

runMasterAdminAndLoginFlowTests().catch(err => {
  console.error("Errore durante il collaudo:", err);
  process.exit(1);
});
