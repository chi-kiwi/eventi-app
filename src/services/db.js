// Mock Database Service with localStorage persistence

const DEFAULT_USERS = [
  {
    id: "usr_1",
    name: "Chiara",
    cognome: "Rossi",
    email: "user@events.com",
    phone: "3331234567",
    comune: "Milano",
    regione: "Lombardia",
    password: "password123",
    role: "utente",
    interests: ["Feste di paese", "Musica", "Street food"],
    premium: false,
    dateOfBirth: "1998-05-15",
    points: 150,
    badges: ["Esploratore"],
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
  },
  {
    id: "org_1",
    name: "Marco",
    cognome: "Bianchi",
    email: "organizer@events.com",
    phone: "3479876543",
    comune: "Saronno",
    regione: "Lombardia",
    password: "password123",
    role: "organizzatore",
    interests: ["Motori", "Sport"],
    premium: true, // "Spunta Blu" active
    dateOfBirth: "1985-11-20",
    points: 50,
    badges: [],
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  },
  {
    id: "col_1",
    name: "Giulia",
    cognome: "Verdi",
    email: "collaborator@events.com",
    phone: "3491112222",
    comune: "Monza",
    regione: "Lombardia",
    password: "password123",
    role: "collaboratore",
    interests: ["Escursioni", "Bambini/Famiglie"],
    premium: false,
    dateOfBirth: "1995-02-10",
    points: 20,
    badges: [],
    invitedBy: "org_1", // Collaborator of org_1
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
  }
];

const DEFAULT_EVENTS = [
  {
    id: "evt_1",
    title: "Gran Festival dello Street Food",
    desc: "Il meglio del cibo da strada nazionale e internazionale nel cuore di Saronno. Oltre 30 food truck, birre artigianali e musica live tutte le sere. Ingresso gratuito!",
    date: new Date().toISOString().split('T')[0], // Today
    time: "18:00",
    location: "Saronno, Piazza Libertà",
    gps: { lat: 45.6264, lng: 9.0347 },
    category: "Street food",
    cost: "Gratuito",
    accessibili: true,
    animali: true,
    parcheggio: true,
    maps_link: "https://maps.google.com/?q=45.6264,9.0347",
    poster: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600",
    gallery: [
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400",
      "https://images.unsplash.com/photo-1565123409695-7b5ef63a24b5?w=400"
    ],
    organizerId: "org_1",
    views: 450,
    interestedUsers: ["usr_1"],
    goingUsers: [],
    savedUsers: [],
    feedback: [],
    updates: [
      { id: "up_1", text: "Disponibili tavoli al coperto in caso di pioggia leggera!", date: new Date().toISOString() }
    ]
  },
  {
    id: "evt_2",
    title: "Concerto Rock sotto le Stelle",
    desc: "Una serata indimenticabile all'insegna del rock classico e alternativo. Band locali ed ospiti speciali si esibiranno sul palco principale. Servizio bar e area ristoro.",
    date: (() => {
      let d = new Date();
      d.setDate(d.getDate() + 2); // 2 days from now (this week)
      return d.toISOString().split('T')[0];
    })(),
    time: "21:00",
    location: "Milano, Parco Sempione",
    gps: { lat: 45.4735, lng: 9.1760 },
    category: "Musica",
    cost: "€15.00",
    accessibili: true,
    animali: false,
    parcheggio: false,
    maps_link: "https://maps.google.com/?q=45.4735,9.1760",
    poster: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&auto=format&fit=crop&q=60",
    gallery: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400"],
    organizerId: "org_1",
    views: 1200,
    interestedUsers: [],
    goingUsers: ["usr_1"],
    savedUsers: [],
    feedback: [],
    updates: []
  },
  {
    id: "evt_3",
    title: "Sagra del Risotto e del Vino",
    desc: "Vieni ad assaggiare i migliori risotti lombardi cucinati da chef locali, accompagnati da vini DOC selezionati. Area bimbi e balli popolari serali.",
    date: (() => {
      let d = new Date();
      // Next Friday (weekend filter test)
      let day = d.getDay();
      let diff = (day <= 5 ? 5 - day : 12 - day);
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    })(),
    time: "12:00",
    location: "Monza, Parco di Monza",
    gps: { lat: 45.5845, lng: 9.2740 },
    category: "Feste di paese",
    cost: "Gratuito",
    accessibili: true,
    animali: true,
    parcheggio: true,
    maps_link: "https://maps.google.com/?q=45.5845,9.2740",
    poster: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600",
    gallery: [],
    organizerId: "org_1",
    views: 280,
    interestedUsers: ["usr_1"],
    goingUsers: [],
    savedUsers: [],
    feedback: [],
    updates: []
  },
  {
    id: "evt_4",
    title: "Escursione Guidata e Birdwatching",
    desc: "Un cammino immerso nella natura alla scoperta delle bellezze della Val di Mello. Adatto a famiglie. Pranzo al sacco o presso rifugio convenzionato.",
    date: (() => {
      let d = new Date();
      d.setDate(d.getDate() + 15); // Later this month
      return d.toISOString().split('T')[0];
    })(),
    time: "09:00",
    location: "Val Masino, Sondrio",
    gps: { lat: 46.2415, lng: 9.6372 },
    category: "Escursioni",
    cost: "€10.00",
    accessibili: false,
    animali: true,
    parcheggio: true,
    maps_link: "https://maps.google.com/?q=46.2415,9.6372",
    poster: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&auto=format&fit=crop&q=60",
    gallery: [],
    organizerId: "col_1",
    views: 120,
    interestedUsers: [],
    goingUsers: [],
    savedUsers: [],
    feedback: [],
    updates: []
  },
  {
    id: "evt_past",
    title: "Sagra degli Gnocchi fatti in Casa",
    desc: "Un evento storico con degustazione di gnocchi al sugo, pesto e formaggio fuso. L'evento si è svolto ieri.",
    date: (() => {
      let d = new Date();
      d.setDate(d.getDate() - 1); // Yesterday (to trigger feedback flow)
      return d.toISOString().split('T')[0];
    })(),
    time: "19:30",
    location: "Oleggio, Piazza Martiri",
    gps: { lat: 45.5982, lng: 8.6369 },
    category: "Feste di paese",
    cost: "Gratuito",
    accessibili: true,
    animali: true,
    parcheggio: true,
    maps_link: "https://maps.google.com/?q=45.5982,8.6369",
    poster: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=60",
    gallery: [],
    organizerId: "org_1",
    views: 400,
    interestedUsers: [],
    goingUsers: ["usr_1"],
    savedUsers: [],
    feedback: [],
    updates: []
  },
  {
    id: "evt_venue",
    title: "Aperitivo Navigli & DJ Set",
    desc: "Un aperitivo esclusivo nel cuore di Milano Navigli. Cocktail bar, stuzzichini gourmet e DJ set deep house per ballare fino a tarda notte. Ingresso con consumazione obbligatoria.",
    date: new Date().toISOString().split('T')[0], // Today
    time: "19:30",
    location: "Milano, Naviglio Grande",
    gps: { lat: 45.4526, lng: 9.1712 },
    category: "Feste nei locali",
    cost: "€15.00",
    accessibili: true,
    animali: false,
    parcheggio: false,
    maps_link: "https://maps.google.com/?q=45.4526,9.1712",
    poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
    gallery: [],
    organizerId: "org_1",
    views: 650,
    interestedUsers: [],
    goingUsers: [],
    savedUsers: [],
    feedback: [],
    updates: []
  }
];

const DEFAULT_MESSAGES = [
  {
    id: "msg_1",
    eventId: "evt_1",
    senderId: "usr_1",
    receiverId: "org_1",
    message: "Ciao! Ci saranno parcheggi per disabili vicino all'ingresso?",
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "msg_2",
    eventId: "evt_1",
    senderId: "org_1",
    receiverId: "usr_1",
    message: "Sì, Chiara. C'è un'area riservata in via Roma, a circa 50 metri dall'evento. Ti aspettiamo!",
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];

// Helper to calculate distance in km using Haversine
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Database wrapper
class LocalDB {
  constructor() {
    this.init();
  }

  awardPoints(user, amount) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!user.xpLog) {
      user.xpLog = {};
    }
    // Clean up old logs to keep it clean
    const keys = Object.keys(user.xpLog);
    if (keys.length > 10) {
      keys.forEach(k => {
        if (k !== todayStr) delete user.xpLog[k];
      });
    }

    const earnedToday = user.xpLog[todayStr] || 0;
    if (earnedToday >= 150) {
      return 0; // daily cap reached
    }
    const allowed = Math.min(amount, 150 - earnedToday);
    user.xpLog[todayStr] = earnedToday + allowed;
    user.points = (user.points || 0) + allowed;
    return allowed;
  }

  init() {
    if (!localStorage.getItem("evt_users")) {
      localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
    } else {
      let storedUsers = localStorage.getItem("evt_users");
      if (storedUsers) {
        let parsed = JSON.parse(storedUsers);
        let updated = false;
        parsed.forEach(u => {
          if (!u.avatar) {
            if (u.id === "usr_1") u.avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";
            else if (u.id === "org_1") u.avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
            else if (u.id === "col_1") u.avatar = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150";
            else u.avatar = "";
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem("evt_users", JSON.stringify(parsed));
        }
      }
    }
    if (!localStorage.getItem("evt_events")) {
      // Ensure DEFAULT_EVENTS are also mapped as objects on new installs
      const seedEvents = DEFAULT_EVENTS.map(e => ({
        ...e,
        gallery: (e.gallery || []).map((url, idx) => ({
          id: `img_${e.id}_${idx}_${Date.now()}`,
          url: url,
          uploaderId: e.organizerId || "org_1",
          uploaderName: "Organizzatore",
          likes: []
        }))
      }));
      localStorage.setItem("evt_events", JSON.stringify(seedEvents));
    } else {
      // Force fix, gallery object migration, and category split migration
      let storedEvents = localStorage.getItem("evt_events");
      if (storedEvents) {
        let parsed = JSON.parse(storedEvents);
        let updated = false;
        parsed.forEach(e => {
          if (e.id === "evt_1" && (!e.poster || e.poster.includes("1565123409695"))) {
            e.poster = "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600";
            updated = true;
          }
          if (e.id === "evt_3" && (!e.poster || e.poster.includes("1544025162"))) {
            e.poster = "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600";
            updated = true;
          }
          // Category migration
          if (e.category === "Sagre" || e.category === "Feste patronali") {
            e.category = "Feste di paese";
            updated = true;
          }
          // Gallery objects migration
          if (e.gallery && e.gallery.length > 0 && typeof e.gallery[0] === 'string') {
            e.gallery = e.gallery.map((url, idx) => ({
              id: `img_${e.id}_${idx}_${Date.now()}`,
              url: url,
              uploaderId: e.organizerId || "org_1",
              uploaderName: "Organizzatore",
              likes: []
            }));
            updated = true;
          }
        });

        // Add evt_venue if missing
        if (!parsed.some(e => e.id === "evt_venue")) {
          const newSeedVenue = {
            id: "evt_venue",
            title: "Aperitivo Navigli & DJ Set",
            desc: "Un aperitivo esclusivo nel cuore di Milano Navigli. Cocktail bar, stuzzichini gourmet e DJ set deep house per ballare fino a tarda notte. Ingresso con consumazione obbligatoria.",
            date: new Date().toISOString().split('T')[0], // Today
            time: "19:30",
            location: "Milano, Naviglio Grande",
            gps: { lat: 45.4526, lng: 9.1712 },
            category: "Feste nei locali",
            cost: "€15.00",
            accessibili: true,
            animali: false,
            parcheggio: false,
            maps_link: "https://maps.google.com/?q=45.4526,9.1712",
            poster: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
            gallery: [],
            organizerId: "org_1",
            views: 650,
            interestedUsers: [],
            goingUsers: [],
            savedUsers: [],
            feedback: [],
            updates: []
          };
          parsed.push(newSeedVenue);
          updated = true;
        }

        if (updated) {
          localStorage.setItem("evt_events", JSON.stringify(parsed));
        }
      }
    }
    if (!localStorage.getItem("evt_messages")) {
      localStorage.setItem("evt_messages", JSON.stringify(DEFAULT_MESSAGES));
    }
    // Track feedback surveys done by user
    if (!localStorage.getItem("evt_feedback_done")) {
      localStorage.setItem("evt_feedback_done", JSON.stringify([]));
    }
    // Initialize community messages
    if (!localStorage.getItem("evt_community_messages")) {
      const defaultCommunityMessages = [
        {
          id: "cm_init_1",
          eventId: "evt_1",
          userId: "usr_1",
          userName: "Chiara Rossi",
          userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
          text: "Ciao a tutti! Qualcuno sa se ci sono opzioni senza glutine tra i food truck?",
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: "cm_init_2",
          eventId: "evt_1",
          userId: "org_1",
          userName: "Marco Bianchi",
          userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          text: "Sì Chiara! Ci saranno ben 4 truck dedicati interamente al gluten-free, segnalati all'ingresso. Ti aspettiamo!",
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      localStorage.setItem("evt_community_messages", JSON.stringify(defaultCommunityMessages));
    }
  }

  getUsers() {
    return JSON.parse(localStorage.getItem("evt_users") || "[]");
  }

  saveUsers(users) {
    localStorage.setItem("evt_users", JSON.stringify(users));
  }

  getEvents() {
    return JSON.parse(localStorage.getItem("evt_events") || "[]");
  }

  saveEvents(events) {
    localStorage.setItem("evt_events", JSON.stringify(events));
  }

  getMessages() {
    return JSON.parse(localStorage.getItem("evt_messages") || "[]");
  }

  saveMessages(messages) {
    localStorage.setItem("evt_messages", JSON.stringify(messages));
  }

  getFeedbackDone() {
    return JSON.parse(localStorage.getItem("evt_feedback_done") || "[]");
  }

  saveFeedbackDone(done) {
    localStorage.setItem("evt_feedback_done", JSON.stringify(done));
  }

  // Auth Functions
  login(credential, password) {
    const users = this.getUsers();
    // Credential can be email or phone
    const user = users.find(u => (u.email === credential || u.phone === credential) && u.password === password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: "Credenziali non valide o password errata." };
  }

  register(userData) {
    const users = this.getUsers();
    // Check constraints
    if (users.some(u => u.email === userData.email)) {
      return { success: false, message: "Questa email è già associata a un altro account." };
    }
    if (users.some(u => u.phone === userData.phone)) {
      return { success: false, message: "Questo numero di telefono è già associato a un altro account." };
    }

    const newUser = {
      id: "usr_" + Date.now(),
      name: userData.name,
      cognome: userData.cognome,
      email: userData.email,
      phone: userData.phone,
      comune: userData.comune,
      regione: userData.regione,
      password: userData.password,
      role: userData.role || "utente", // 'utente', 'organizzatore'
      interests: userData.interests || [],
      premium: false,
      dateOfBirth: userData.dateOfBirth || "",
      points: 0,
      badges: []
    };

    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  }

  updateProfile(userId, updatedFields, securityPassword) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false, message: "Utente non trovato." };

    // Validate security password
    if (users[index].password !== securityPassword) {
      return { success: false, message: "Password di sicurezza errata. Modifica rifiutata." };
    }

    // Check unique constraints if fields are updated
    if (updatedFields.email && updatedFields.email !== users[index].email) {
      if (users.some(u => u.email === updatedFields.email)) {
        return { success: false, message: "Questa email è già registrata." };
      }
    }
    if (updatedFields.phone && updatedFields.phone !== users[index].phone) {
      if (users.some(u => u.phone === updatedFields.phone)) {
        return { success: false, message: "Questo numero di telefono è già registrato." };
      }
    }

    // Apply updates
    users[index] = { ...users[index], ...updatedFields };
    this.saveUsers(users);
    return { success: true, user: users[index] };
  }

  resetPassword(credential, newPassword) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.email === credential || u.phone === credential);
    if (index === -1) return { success: false, message: "Nessun account associato a questo contatto." };

    users[index].password = newPassword;
    this.saveUsers(users);
    return { success: true, message: "Password reimpostata con successo!" };
  }

  // Events Functions
  checkCollision(eventData) {
    const events = this.getEvents();
    const targetDate = eventData.date;
    const targetGPS = eventData.gps;
    const targetCategory = eventData.category;

    const nearbyEvents = events.filter(e => {
      if (e.date !== targetDate) return false;
      const dist = getDistance(targetGPS.lat, targetGPS.lng, e.gps.lat, e.gps.lng);
      
      if (targetCategory === 'Feste di paese') {
        return dist <= 20;
      }
      if (targetCategory === 'Feste nei locali') {
        return e.category === 'Feste nei locali' && dist <= 5;
      }
      return dist <= 15;
    });

    return nearbyEvents.length > 0 ? nearbyEvents[0] : null;
  }

  createEvent(eventData, organizerId) {
    const events = this.getEvents();
    
    const targetDate = eventData.date;
    const targetGPS = eventData.gps;
    const targetCategory = eventData.category;

    const nearbyEvents = events.filter(e => {
      if (e.date !== targetDate) return false;
      const dist = getDistance(targetGPS.lat, targetGPS.lng, e.gps.lat, e.gps.lng);
      
      // Feste di paese clash in a wide radius (20km) with any other event
      if (targetCategory === 'Feste di paese') {
        return dist <= 20;
      }
      // Feste nei locali clash in a narrow radius (5km) only with other venue parties
      if (targetCategory === 'Feste nei locali') {
        return e.category === 'Feste nei locali' && dist <= 5;
      }
      // Other categories clash within a standard 15km radius
      return dist <= 15;
    });

    const warning = nearbyEvents.length > 0
      ? `Attenzione: Nello stesso raggio di ${targetCategory === 'Feste nei locali' ? '5' : '20'} km risulta già un evento compatibile ("${nearbyEvents[0].title}") lo stesso giorno.`
      : null;

    const newEvent = {
      id: "evt_" + Date.now(),
      ...eventData,
      organizerId,
      views: 0,
      interestedUsers: [],
      goingUsers: [],
      savedUsers: [],
      feedback: [],
      updates: []
    };

    events.push(newEvent);
    this.saveEvents(events);

    return { success: true, event: newEvent, warning };
  }

  editEvent(eventId, updatedFields, editorId) {
    const events = this.getEvents();
    const users = this.getUsers();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false, message: "Evento non trovato." };

    const event = events[index];
    const editor = users.find(u => u.id === editorId);

    // Permission check
    const isOwner = event.organizerId === editorId;
    const isInvitedCollaborator = editor && editor.role === "collaboratore" && editor.invitedBy === event.organizerId;

    if (!isOwner && !isInvitedCollaborator) {
      return { success: false, message: "Non disponi delle autorizzazioni per modificare questo evento." };
    }

    // Collaborators have limited permissions
    if (isInvitedCollaborator) {
      // Can only modify description, add photo/gallery, publish updates. Cannot change cost, date, location, etc.
      event.desc = updatedFields.desc !== undefined ? updatedFields.desc : event.desc;
      if (updatedFields.gallery) {
        event.gallery = [...event.gallery, ...updatedFields.gallery];
      }
    } else {
      // Owner can change everything
      events[index] = { ...event, ...updatedFields };
    }

    this.saveEvents(events);
    return { success: true, event: events[index] };
  }

  deleteEvent(eventId, userId) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false, message: "Evento non trovato." };

    if (events[index].organizerId !== userId) {
      return { success: false, message: "Solo l'organizzatore principale può eliminare questo evento." };
    }

    events.splice(index, 1);
    this.saveEvents(events);
    return { success: true };
  }

  toggleParticipation(eventId, userId, type) {
    // type: 'interested' (Mi interessa), 'going' (Ci sarò), 'saved' (Salva per dopo)
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false };

    const event = events[index];
    
    if (type === 'interested') {
      const idx = event.interestedUsers.indexOf(userId);
      if (idx === -1) {
        event.interestedUsers.push(userId);
        // remove from others if necessary
      } else {
        event.interestedUsers.splice(idx, 1);
      }
    } else if (type === 'going') {
      const idx = event.goingUsers.indexOf(userId);
      if (idx === -1) {
        event.goingUsers.push(userId);
        // remove from interested
        const intIdx = event.interestedUsers.indexOf(userId);
        if (intIdx !== -1) event.interestedUsers.splice(intIdx, 1);
      } else {
        event.goingUsers.splice(idx, 1);
      }
    } else if (type === 'saved') {
      const idx = event.savedUsers.indexOf(userId);
      if (idx === -1) {
        event.savedUsers.push(userId);
      } else {
        event.savedUsers.splice(idx, 1);
      }
    }

    this.saveEvents(events);
    return { success: true, event };
  }

  addPhotoToEvent(eventId, photoUrl, uploaderId, uploaderName) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false };

    if (!events[index].gallery) events[index].gallery = [];
    
    const newPhoto = {
      id: `img_${Date.now()}`,
      url: photoUrl,
      uploaderId: uploaderId || "usr_unknown",
      uploaderName: uploaderName || "Utente",
      likes: []
    };
    events[index].gallery.push(newPhoto);
    this.saveEvents(events);
    return { success: true, event: events[index] };
  }

  togglePhotoLike(eventId, photoId, userId) {
    const events = this.getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return { success: false };

    const event = events[eventIndex];
    if (!event.gallery) event.gallery = [];
    const photo = event.gallery.find(p => p.id === photoId);
    if (!photo) return { success: false };

    if (!photo.likes) photo.likes = [];
    const idx = photo.likes.indexOf(userId);
    let liked = false;
    let xpAwarded = 0;

    if (idx === -1) {
      photo.likes.push(userId);
      liked = true;
      // Award +5 XP to photo uploader (if it's not the user liking their own photo)
      if (photo.uploaderId && photo.uploaderId !== userId) {
        const users = this.getUsers();
        const uploaderIndex = users.findIndex(u => u.id === photo.uploaderId);
        if (uploaderIndex !== -1) {
          xpAwarded = this.awardPoints(users[uploaderIndex], 5);
          this.saveUsers(users);
        }
      }
    } else {
      photo.likes.splice(idx, 1);
    }

    this.saveEvents(events);
    return { success: true, event, liked, xpAwarded, uploaderId: photo.uploaderId };
  }

  getCommunityMessages(eventId) {
    const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
    const users = this.getUsers();
    return all
      .filter(m => m.eventId === eventId)
      .map(m => {
        const u = users.find(usr => usr.id === m.userId);
        return {
          ...m,
          userName: u ? `${u.name} ${u.cognome}` : m.userName,
          userAvatar: u ? u.avatar : m.userAvatar
        };
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  addCommunityMessage(eventId, userId, userName, userAvatar, text) {
    const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
    const newMessage = {
      id: "cm_" + Date.now(),
      eventId,
      userId,
      userName,
      userAvatar: userAvatar || "",
      text,
      timestamp: new Date().toISOString()
    };
    all.push(newMessage);
    localStorage.setItem("evt_community_messages", JSON.stringify(all));

    // Award +2 XP to the user for contributing to the community board
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    let userPoints = 0;
    if (userIndex !== -1) {
      this.awardPoints(users[userIndex], 2);
      this.saveUsers(users);
      userPoints = users[userIndex].points;
    }

    return { success: true, message: newMessage, userPoints };
  }

  addEventUpdate(eventId, userId, text) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false };

    const event = events[index];
    // Check permission
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    const isOwner = event.organizerId === userId;
    const isCollaborator = user && user.role === 'collaboratore' && user.invitedBy === event.organizerId;

    if (!isOwner && !isCollaborator) {
      return { success: false, message: "Non autorizzato." };
    }

    if (!event.updates) event.updates = [];
    const newUpdate = {
      id: "up_" + Date.now(),
      text,
      date: new Date().toISOString()
    };
    event.updates.unshift(newUpdate);
    this.saveEvents(events);
    return { success: true, update: newUpdate };
  }

  addFeedback(eventId, userId, feedbackData) {
    const events = this.getEvents();
    const users = this.getUsers();
    const doneFeedback = this.getFeedbackDone();

    const evIndex = events.findIndex(e => e.id === eventId);
    if (evIndex === -1) return { success: false };

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false };

    const user = users[userIndex];
    const event = events[evIndex];

    // Add to event feedback
    if (!event.feedback) event.feedback = [];
    event.feedback.push({
      userId,
      userAge: user.dateOfBirth ? (new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()) : null,
      userProvenance: user.comune,
      ...feedbackData
    });
    this.saveEvents(events);

    // Record feedback completed
    doneFeedback.push(eventId);
    this.saveFeedbackDone(doneFeedback);

    // Gamification rewards: Add points and check badges
    this.awardPoints(user, 50); // 50 points for feedback!
    
    // Check badges
    if (user.points >= 200 && !user.badges.includes("Esploratore")) {
      user.badges.push("Esploratore");
    }
    
    // Unlocking specific badges based on categories of feedback
    const categoryCount = events.filter(e => e.goingUsers.includes(userId) && doneFeedback.includes(e.id)).reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    if (categoryCount["Feste di paese"] >= 1 && !user.badges.includes("Re delle feste di paese")) {
      user.badges.push("Re delle feste di paese");
    }
    if (categoryCount["Motori"] >= 1 && !user.badges.includes("Amante dei motori")) {
      user.badges.push("Amante dei motori");
    }
    if (categoryCount["Musica"] >= 1 && !user.badges.includes("Cacciatore di concerti")) {
      user.badges.push("Cacciatore di concerti");
    }

    this.saveUsers(users);

    return { success: true, user };
  }

  // Chats & Messaging
  getChatsForUser(userId) {
    const msgs = this.getMessages();
    const users = this.getUsers();
    const events = this.getEvents();

    // Find all distinct chat lines for this user
    // A chat is uniquely defined by (eventId, userPart, organizerPart)
    // Filter messages where user is sender or receiver
    const userMsgs = msgs.filter(m => m.senderId === userId || m.receiverId === userId);
    
    const chatMap = new Map();
    userMsgs.forEach(m => {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      const key = `${m.eventId}_${otherId}`;
      if (!chatMap.has(key) || new Date(chatMap.get(key).timestamp) < new Date(m.timestamp)) {
        const otherUser = users.find(u => u.id === otherId);
        const event = events.find(e => e.id === m.eventId);
        chatMap.set(key, {
          eventId: m.eventId,
          eventTitle: event ? event.title : "Evento",
          otherUserId: otherId,
          otherUserName: otherUser ? `${otherUser.name} ${otherUser.cognome}` : "Utente",
          otherUserRole: otherUser ? otherUser.role : "utente",
          lastMessage: m.message,
          timestamp: m.timestamp
        });
      }
    });

    return Array.from(chatMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getChatMessages(eventId, user1, user2) {
    const msgs = this.getMessages();
    return msgs.filter(m => 
      m.eventId === eventId && 
      ((m.senderId === user1 && m.receiverId === user2) || (m.senderId === user2 && m.receiverId === user1))
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  sendMessage(eventId, senderId, receiverId, text) {
    const msgs = this.getMessages();
    const newMessage = {
      id: "msg_" + Date.now(),
      eventId,
      senderId,
      receiverId,
      message: text,
      timestamp: new Date().toISOString()
    };
    msgs.push(newMessage);
    this.saveMessages(msgs);
    return newMessage;
  }

  // Invite Collaborator
  inviteCollaborator(organizerId, email, name, cognome, phone, password) {
    const users = this.getUsers();
    
    if (users.some(u => u.email === email)) {
      return { success: false, message: "Questa email è già associata a un account." };
    }

    const newCollaborator = {
      id: "col_" + Date.now(),
      name,
      cognome,
      email,
      phone,
      comune: "Da impostare",
      regione: "Lombardia",
      password,
      role: "collaboratore",
      interests: [],
      premium: false,
      dateOfBirth: "",
      points: 0,
      badges: [],
      invitedBy: organizerId
    };

    users.push(newCollaborator);
    this.saveUsers(users);
    return { success: true, collaborator: newCollaborator };
  }

  // Spunta Blu subscription activation
  activatePremium(userId) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false };

    users[index].premium = true;
    this.saveUsers(users);
    return { success: true, user: users[index] };
  }

  // Increment event views
  incrementViews(eventId) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      events[index].views = (events[index].views || 0) + 1;
      this.saveEvents(events);
    }
  }
}

export const db = new LocalDB();
