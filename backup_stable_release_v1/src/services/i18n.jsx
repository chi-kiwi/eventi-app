import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  it: {
    // Navigation / Tabs
    explore: "Esplora",
    calendar: "Calendario",
    chats: "Chat",
    dashboard: "Dashboard",
    profile: "Profilo",
    logout: "Esci",
    
    // Explore View
    search_placeholder: "Cerca eventi per titolo o luogo...",
    category_label: "Categoria",
    region_label: "Regione",
    view_list: "Vista Lista",
    view_map: "Vista Radar",
    no_events: "Nessun evento trovato con i filtri selezionati.",
    all: "Tutti",
    
    // Event Details
    cost: "Costo",
    time: "Ora",
    location: "Luogo",
    distance_from_you: "da te",
    interested_btn: "Mi interessa 📌",
    going_btn: "Ci sarò 🎟️",
    saved_btn: "Salvato ✔️",
    not_interested_btn: "Rimuovi interesse",
    not_going_btn: "Rimuovi presenza",
    not_saved_btn: "Rimuovi salvataggio",
    accessibility: "Accessibile in sedia a rotelle",
    animals: "Animali ammessi",
    parking: "Parcheggio disponibile",
    weather_forecast: "Meteo Stimato",
    bring_me_here: "Portami Qui 🗺️",
    export_calendar: "Aggiungi al Calendario 📅",
    community_board: "Bacheca della Community 💬",
    community_sub: "Organizza passaggi, fai domande o coordinati (+2 XP)",
    photo_gallery: "Galleria Foto 📸",
    photo_sub: "Condividi un momento dell'evento (+5 XP se ricevi Like)",
    send_msg_placeholder: "Scrivi un messaggio nella bacheca...",
    send: "Invia",
    upload_photo: "Carica Foto",
    photo_uploader: "Caricata da",
    likes: "Mi piace",
    chat_organizer: "Chatta con l'Organizzatore 💬",
    event_updates: "Notifiche & Aggiornamenti dell'Organizzatore 📢",
    no_updates: "Nessun aggiornamento pubblicato per questo evento.",
    
    // Profile
    level: "Livello",
    xp_points: "Punti XP",
    next_level_xp: "XP per il livello successivo",
    unlocked_badges: "Badge Sbloccati 🏅",
    no_badges: "Nessun badge sbloccato. Partecipa agli eventi per sbloccarli!",
    edit_profile_btn: "Modifica Dati Profilo",
    change_avatar: "Clicca sull'avatar per cambiarlo",
    save_changes: "Salva Modifiche",
    cancel: "Annulla",
    security_password_label: "Inserisci la tua password per confermare le modifiche",
    otp_title: "Verifica OTP di Sicurezza 🔒",
    otp_subtitle: "Inserisci il codice temporaneo inviato al tuo recapito per autorizzare la modifica dei dati sensibili",
    otp_placeholder: "Codice OTP (es. 1234)",
    confirm: "Conferma",
    otp_error: "Codice OTP non valido. Riprova con 1234.",
    
    // Login / Register
    login_title: "Accedi a EventiApp",
    register_title: "Crea un nuovo account",
    email_or_phone: "Email o Numero di telefono",
    password: "Password",
    login_btn: "Accedi",
    register_btn: "Registrati",
    no_account: "Non hai un account? Registrati",
    already_account: "Hai già un account? Accedi",
    name: "Nome",
    cognome: "Cognome",
    phone: "Numero di cellulare",
    comune: "Comune di residenza",
    regione: "Regione",
    date_of_birth: "Data di nascita",
    role: "Tipo di account",
    role_user: "Utente (Partecipante)",
    role_organizer: "Organizzatore di eventi",
    interests_title: "Scegli i tuoi interessi (max 3)",
    register_success: "Registrazione completata con successo!",
    
    // Organizer Dashboard
    org_panel: "Pannello di Controllo dell'Organizzatore",
    create_event_btn: "Pubblica Nuovo Evento",
    my_events: "I miei eventi pubblicati",
    collaborators: "Collaboratori Registrati 👥",
    add_collaborator: "Aggiungi Collaboratore",
    stats: "Statistiche Generali",
    total_views: "Visualizzazioni totali",
    total_going: "Partecipanti registrati",
    total_interested: "Utenti interessati",
    event_title: "Titolo dell'evento",
    event_desc: "Descrizione dell'evento",
    event_date: "Data dell'evento",
    event_time: "Ora dell'evento",
    event_location: "Luogo dell'evento",
    event_category: "Categoria",
    event_cost: "Costo (es. Gratuito o €10.00)",
    submit_event: "Crea Evento",
    send_update_btn: "Invia Aggiornamento",
    update_placeholder: "Scrivi un avviso importante per i partecipanti...",
    clash_warning: "Attenzione: Rilevato un altro evento simile nelle vicinanze in questa data!",
    
    // General
    feedback_title: "Come è andato l'evento? ⭐️",
    feedback_subtitle: "Inserisci la tua valutazione per aiutarci a migliorare e guadagnare +50 XP!",
    rating: "Valutazione",
    review_placeholder: "Lascia una recensione (facoltativa)...",
    submit_feedback: "Invia Feedback",
    league_gold: "Lega Oro 🥇",
    league_silver: "Lega Argento 🥈",
    league_bronze: "Lega Bronzo 🥉",
    league_platinum: "Lega Platino 💎",
    league_diamond: "Lega Diamante 🏆",
    league_details_title: "Dettaglio Leghe EventiApp"
  },
  en: {
    // Navigation / Tabs
    explore: "Explore",
    calendar: "Calendar",
    chats: "Chats",
    dashboard: "Dashboard",
    profile: "Profile",
    logout: "Log Out",
    
    // Explore View
    search_placeholder: "Search events by title or location...",
    category_label: "Category",
    region_label: "Region",
    view_list: "List View",
    view_map: "Radar View",
    no_events: "No events found with the selected filters.",
    all: "All",
    
    // Event Details
    cost: "Cost",
    time: "Time",
    location: "Location",
    distance_from_you: "from you",
    interested_btn: "Interested 📌",
    going_btn: "Going 🎟️",
    saved_btn: "Saved ✔️",
    not_interested_btn: "Remove Interest",
    not_going_btn: "Remove Going",
    not_saved_btn: "Remove Saved",
    accessibility: "Wheelchair accessible",
    animals: "Pets allowed",
    parking: "Parking available",
    weather_forecast: "Estimated Weather",
    bring_me_here: "Get Directions 🗺️",
    export_calendar: "Add to Calendar 📅",
    community_board: "Community Board 💬",
    community_sub: "Arrange carpools, ask questions, or coordinate (+2 XP)",
    photo_gallery: "Photo Gallery 📸",
    photo_sub: "Share a photo of the event (+5 XP on likes received)",
    send_msg_placeholder: "Write a message on the board...",
    send: "Send",
    upload_photo: "Upload Photo",
    photo_uploader: "Uploaded by",
    likes: "Likes",
    chat_organizer: "Chat with the Organizer 💬",
    event_updates: "Organizer Announcements & Updates 📢",
    no_updates: "No updates posted for this event.",
    
    // Profile
    level: "Level",
    xp_points: "XP Points",
    next_level_xp: "XP for next level",
    unlocked_badges: "Unlocked Badges 🏅",
    no_badges: "No badges unlocked yet. Join events to unlock them!",
    edit_profile_btn: "Edit Profile Details",
    change_avatar: "Click on avatar to change it",
    save_changes: "Save Changes",
    cancel: "Cancel",
    security_password_label: "Enter your password to confirm changes",
    otp_title: "Security OTP Verification 🔒",
    otp_subtitle: "Enter the temporary code sent to your device to authorize sensitive changes",
    otp_placeholder: "OTP Code (e.g. 1234)",
    confirm: "Confirm",
    otp_error: "Invalid OTP code. Please try with 1234.",
    
    // Login / Register
    login_title: "Log in to EventiApp",
    register_title: "Create a new account",
    email_or_phone: "Email or Phone number",
    password: "Password",
    login_btn: "Log In",
    register_btn: "Sign Up",
    no_account: "Don't have an account? Sign Up",
    already_account: "Already have an account? Log In",
    name: "First Name",
    cognome: "Last Name",
    phone: "Mobile Number",
    comune: "City of residence",
    regione: "Region",
    date_of_birth: "Date of Birth",
    role: "Account Type",
    role_user: "User (Attendee)",
    role_organizer: "Event Organizer",
    interests_title: "Choose your interests (max 3)",
    register_success: "Registration completed successfully!",
    
    // Organizer Dashboard
    org_panel: "Organizer Control Panel",
    create_event_btn: "Publish New Event",
    my_events: "My published events",
    collaborators: "Registered Collaborators 👥",
    add_collaborator: "Add Collaborator",
    stats: "General Statistics",
    total_views: "Total views",
    total_going: "Registered attendees",
    total_interested: "Interested users",
    event_title: "Event Title",
    event_desc: "Event Description",
    event_date: "Event Date",
    event_time: "Event Time",
    event_location: "Event Location",
    event_category: "Category",
    event_cost: "Cost (e.g. Free or $10.00)",
    submit_event: "Create Event",
    send_update_btn: "Post Update",
    update_placeholder: "Write an important notice for attendees...",
    clash_warning: "Warning: Another similar event detected nearby on this date!",
    
    // General
    feedback_title: "How was the event? ⭐️",
    feedback_subtitle: "Submit your rating to help us improve and earn +50 XP!",
    rating: "Rating",
    review_placeholder: "Leave a review (optional)...",
    submit_feedback: "Submit Feedback",
    league_gold: "Gold League 🥇",
    league_silver: "Silver League 🥈",
    league_bronze: "Bronze League 🥉",
    league_platinum: "Platinum League 💎",
    league_diamond: "Diamond League 🏆",
    league_details_title: "EventiApp Leagues Detail"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('evt_lang') || 'it';
  });

  useEffect(() => {
    localStorage.setItem('evt_lang', language);
  }, [language]);

  const t = (key) => {
    const langDict = translations[language] || translations['it'];
    return langDict[key] || translations['it'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
