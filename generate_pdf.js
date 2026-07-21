import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Create a PDF Document
const doc = new PDFDocument({ margin: 50, size: 'A4' });
const outputPath = path.resolve('Guida_Funzionalita_EventiApp.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Define primary styling colors
const primaryColor = '#4f46e5'; // Indigo
const textColor = '#1e293b'; // Slate 800
const subTextColor = '#64748b'; // Slate 500
const borderColor = '#e2e8f0'; // Slate 200

// --- DOCUMENT HEADER ---
doc.fillColor(primaryColor)
   .fontSize(26)
   .text('EventiApp 🎟️', { align: 'center' });

doc.fillColor(textColor)
   .fontSize(16)
   .text('Guida Ufficiale alle Funzionalità & Manuale Utente', { align: 'center' })
   .moveDown(0.2);

doc.fillColor(subTextColor)
   .fontSize(10)
   .text('Un prototipo di SPA Premium esteticamente curato e interattivo', { align: 'center' })
   .moveDown(1.5);

// Horizontal line divider
doc.strokeColor(borderColor)
   .lineWidth(1)
   .moveTo(50, doc.y)
   .lineTo(545, doc.y)
   .stroke()
   .moveDown(1);

// Helper function to render a clean section title
function addSectionHeader(title) {
  doc.fillColor(primaryColor)
     .fontSize(14)
     .text(title, { underline: false })
     .moveDown(0.4);
}

// Helper function to render a feature bullet item
function addFeatureItem(boldTitle, description) {
  doc.fillColor(textColor)
     .fontSize(10)
     .text('• ', { continued: true })
     .text(boldTitle + ': ', { bold: true, continued: true })
     .fillColor(textColor)
     .text(description)
     .moveDown(0.3);
}

// --- SECTION 1 ---
addSectionHeader('1. Navigazione & Filtri Avanzati');
addFeatureItem('Esplorazione Dinamica', 'Feed degli eventi attivi ordinato in base alla priorità dell\'organizzatore (gli organizzatori certificati con Spunta Blu compaiono in evidenza).');
addFeatureItem('Tutte le 20 Regioni Italiane', 'Filtro di ricerca geografica con l\'elenco completo di tutte le 20 regioni d\'Italia per trovare eventi locali.');
addFeatureItem('Filtro Categoria "Salvati 📌"', 'Filtro rapido posizionato all\'inizio della barra delle categorie. Mostra con un solo clic gli eventi per i quali l\'utente ha indicato "Mi interessa", "Ci sarò" o "Salva per dopo".');
addFeatureItem('Switcher Vista Mappa Radar vs Lista', 'Pulsante animato per passare istantaneamente dalla visualizzazione a griglia a quella a radar GPS interattivo.');
doc.moveDown(0.5);

// --- SECTION 2 ---
addSectionHeader('2. Mappa Radar GPS Interattiva & Distanze');
addFeatureItem('Mappa Radar con Collegamenti', 'Rappresentazione cartografica di test delle città principali con griglia e calcolo delle distanze.');
addFeatureItem('Centratura Automatica sul Profilo', 'All\'avvio, la mappa radar legge la città specificata nel profilo dell\'utente (es. Chiara da Milano) e si posiziona automaticamente su quell\'area.');
addFeatureItem('Simulatore di Posizione GPS', 'Consente all\'utente di cliccare su diverse città della Lombardia per simulare uno spostamento sul territorio, attivando banner di notifica di prossimità ("On the Road").');
addFeatureItem('Filtro Raggio di Ricerca (km)', 'Pulsanti per limitare gli eventi mostrati sulla mappa entro un raggio di 10 km, 25 km, 50 km o 100 km.');
addFeatureItem('Calcolo Distanza in Tempo Reale', 'Ciascuna scheda evento indica automaticamente la distanza in chilometri dalla città impostata nel profilo dell\'utente (es. "Saronno (12.3 km da te)").');
doc.moveDown(0.5);

// --- SECTION 3 ---
addSectionHeader('3. Dettaglio Evento, Meteo & Direzioni');
addFeatureItem('Previsioni Meteo Integrate', 'Widget meteo che mostra le condizioni atmosferiche stimate per il giorno dell\'evento (es. soleggiato per le escursioni, sereno per le feste di paese all\'aperto).');
addFeatureItem('Portami Qui (Navigatore)', 'Menu a comparsa con scorciatoie per aprire le coordinate dell\'evento direttamente su Google Maps, Apple Maps o Waze.');
addFeatureItem('Esportazione nel Calendario', 'Pulsanti per aggiungere l\'evento a Google Calendar o scaricare un file .ics per Apple Calendar e Outlook.');
doc.moveDown(0.5);

// --- SECTION 4 ---
addSectionHeader('4. Gamification: Livelli, Leghe & Badge');
addFeatureItem('Barra di Progresso XP', 'Pannello sul profilo con calcolo percentuale dei punti esperienza (XP) accumulati verso il livello successivo.');
addFeatureItem('Le Leghe Ufficiali', '5 livelli di posizionamento: Bronzo (0-99 XP), Argento (100-249 XP), Oro (250-499 XP), Platino (500-999 XP) e Diamante (1000+ XP). Cliccando sulla scheda si apre un modal con l\'elenco e i dettagli di tutti i bonus.');
addFeatureItem('Badge Sbloccabili', 'Riconoscimenti grafici ottenuti compiendo azioni specifiche (es. "Esploratore" sbloccato partecipando a escursioni o a 200 XP, "Re delle feste di paese", "Cacciatore di concerti").');
doc.moveDown(0.5);

// Page break for document spacing & clean alignment
doc.addPage();

doc.fillColor(primaryColor)
   .fontSize(16)
   .text('EventiApp - Manuale Funzionalità (Pagina 2)', { align: 'center' })
   .moveDown(1);

// --- SECTION 5 ---
addSectionHeader('5. Elementi Social & Community Collaborative');
addFeatureItem('Bacheca della Community', 'Spazio di discussione pubblico nei dettagli dell\'evento per organizzare passaggi auto, fare domande o coordinarsi. Ogni messaggio inserito assegna +2 XP all\'utente.');
addFeatureItem('Galleria Foto con Like', 'Consente di caricare immagini dell\'evento. Ciascuna foto dispone di un contatore di preferenze (Like) interattivo.');
addFeatureItem('XP & Notifiche per i Like', 'Ricevere un "Mi piace" da un altro utente assegna all\'autore dello scatto +5 XP e genera una notifica di sistema in background.');
addFeatureItem('Lightbox Slider', 'Visualizzatore di foto a schermo intero con tasti di scorrimento e indicazione dell\'autore dello scatto (es. "Caricata da Chiara Rossi").');
doc.moveDown(0.5);

// --- SECTION 6 ---
addSectionHeader('6. Sicurezza del Profilo & Decluttering');
addFeatureItem('Popup Modali Salvaspazio', 'I moduli di modifica dei dati e la tabella delle leghe sono stati spostati in modali con effetto vetro sfocato (glassmorphic) per mantenere l\'aspetto visivo pulito ed elegante.');
addFeatureItem('Verifica OTP di Sicurezza', 'Per salvare modifiche a email, telefono o password, l\'applicazione richiede un codice di verifica a 4 cifre (codice simulato "1234") inviato al recapito dell\'utente.');
addFeatureItem('Personalizzazione Avatar', 'Foto profilo circolare modificabile cliccando direttamente sull\'immagine. Offre 8 splendidi preset di alta qualità o l\'inserimento di un indirizzo URL personalizzato.');
doc.moveDown(0.5);

// --- SECTION 7 ---
addSectionHeader('7. Pannelli di Ruolo (Attendee / Organizer)');
addFeatureItem('Pannello di Controllo dell\'Organizzatore', 'Marco (l\'organizzatore) accede ad una dashboard privata per pubblicare eventi, monitorare le statistiche di visualizzazione e registrare Collaboratori.');
addFeatureItem('Collaboratori con Accesso Limitato', 'Giulia (il collaboratore) accede all\'app per pubblicare avvisi importanti o aggiungere foto, senza poter modificare dettagli sensibili come prezzi e date.');
doc.moveDown(0.5);

// --- SECTION 8 ---
addSectionHeader('8. Centro Notifiche Bell');
addFeatureItem('Icona di Segnalazione', 'La campanella nell\'intestazione mostra un badge rosso per indicare la presenza di notifiche non lette.');
addFeatureItem('Menu delle Notifiche', 'Cassetto a comparsa che elenca lo storico degli avvisi (benvenuto, sblocco di badge, preferenze ricevute sulle foto, passaggi di lega).');
doc.moveDown(1.5);

// --- BOX: CREDENZIALI DI TEST ---
doc.fillColor(textColor)
   .fontSize(11)
   .text('Credenziali di Test Pre-configurate:', { bold: true })
   .moveDown(0.3);

doc.fontSize(9)
   .fillColor(textColor)
   .text('1. Chiara (Utente Standard): ', { bold: true, continued: true })
   .text('email: user@events.com  /  password: password123 (Silver League, XP 150)')
   .text('2. Marco (Organizzatore Premium): ', { bold: true, continued: true })
   .text('email: organizer@events.com  /  password: password123 (Spunta Blu)')
   .text('3. Giulia (Collaboratore invitato): ', { bold: true, continued: true })
   .text('email: collaborator@events.com  /  password: password123');

// Close and save PDF
doc.end();
console.log('PDF generated successfully at Guida_EventiApp.pdf');
