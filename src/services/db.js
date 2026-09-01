// Mock Database Service with localStorage persistence

let _cloudCommunityCache = [];
let _cloudPrivateCache = [];

const DEFAULT_USERS = [
  {
    id: "org_1",
    name: "Chiara",
    cognome: "Francescon",
    email: "chiara@eventiapp.com",
    phone: "3331234567",
    comune: "Comignago",
    regione: "Piemonte",
    password: "password123",
    role: "organizzatore",
    interests: ["Feste di paese", "Musica", "Street food", "Motori"],
    premium: true, // "Spunta Blu" active
    dateOfBirth: "1998-05-15",
    points: 500,
    collabId: "COL-100001",
    badges: ["Fondatore", "Super Organizzatore"],
    avatar: "/logo.jpg"
  },
  {
    id: "org_admin_2",
    name: "Chiara",
    cognome: "Francescon",
    email: "chiarettafrancescon@gmail.com",
    phone: "3339998877",
    comune: "Comignago",
    regione: "Piemonte",
    password: "password123",
    role: "organizzatore",
    interests: ["Feste di paese", "Musica", "Street food", "Motori"],
    premium: true, // "Spunta Blu" active
    dateOfBirth: "1998-05-15",
    points: 500,
    collabId: "COL-100002",
    badges: ["Fondatore", "Super Organizzatore", "Admin Master"],
    avatar: "/logo.jpg",
    emailVerified: true
  }
];

const DEFAULT_EVENTS = [];

const DEFAULT_MESSAGES = [];

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

// Setup global BroadcastChannel for multi-tab / multi-window real-time sync
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('evt_realtime_sync_v1');
    syncChannel.onmessage = (event) => {
      const { type, data } = event.data || {};
      if (type === 'NEW_COMMUNITY_MESSAGE') {
        const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
        if (!all.some(m => m.id === data.id)) {
          all.push(data);
          localStorage.setItem("evt_community_messages", JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('evt_community_updated'));
        }
      } else if (type === 'NEW_PRIVATE_MESSAGE') {
        const msgs = JSON.parse(localStorage.getItem("evt_messages") || "[]");
        if (!msgs.some(m => m.id === data.id)) {
          msgs.push(data);
          localStorage.setItem("evt_messages", JSON.stringify(msgs));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('evt_chat_updated'));
        }
      }
    };
  }
} catch (e) {
  console.warn("BroadcastChannel initialization notice:", e);
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
    // One-time clean migration to purge legacy demo accounts & mock events
    try {
      if (!localStorage.getItem("evt_clean_production_v2")) {
        const storedUsers = JSON.parse(localStorage.getItem("evt_users") || "[]");
        const cleanUsers = storedUsers.filter(u => u.id === "org_1" || (!u.id.startsWith("usr_1") && !u.id.startsWith("col_1") && u.email !== "user@events.com" && u.email !== "collaborator@events.com" && !u.name?.includes("Bianchi")));
        if (!cleanUsers.some(u => u.id === "org_1")) {
          cleanUsers.unshift(...DEFAULT_USERS);
        }
        localStorage.setItem("evt_users", JSON.stringify(cleanUsers));

        const storedEvts = JSON.parse(localStorage.getItem("evt_events") || "[]");
        const cleanEvts = storedEvts.filter(e => {
          if (!e || e.isDemo) return false;
          const t = (e.title || "").toLowerCase();
          const d = (e.desc || "").toLowerCase();
          if (t.includes("esempio") || t.includes("zucca") || t.includes("salamella") || t === "ciao" || d === "ciao" || t.includes("test")) return false;
          return true;
        });
        localStorage.setItem("evt_events", JSON.stringify(cleanEvts));

        localStorage.removeItem("evt_community_messages");
        localStorage.removeItem("evt_messages");
        localStorage.removeItem("evt_follows");
        localStorage.setItem("evt_clean_production_v2", "true");
      }
    } catch (e) {}

    try {
      if (!localStorage.getItem("evt_users")) {
        localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
      } else {
        let storedUsers = localStorage.getItem("evt_users");
        if (storedUsers) {
          let parsed = JSON.parse(storedUsers);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
            parsed = DEFAULT_USERS;
          }
          if (!parsed.some(u => u.email === "chiarettafrancescon@gmail.com")) {
            parsed.push(DEFAULT_USERS[1]);
            localStorage.setItem("evt_users", JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.error("Error initializing users:", e);
      localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
    }

    // One-time migration to clear mock events and start clean
    if (!localStorage.getItem("evt_production_ready")) {
      localStorage.setItem("evt_events", JSON.stringify(DEFAULT_EVENTS));
      localStorage.setItem("evt_production_ready", "true");
    }

    try {
      if (!localStorage.getItem("evt_events")) {
        localStorage.setItem("evt_events", JSON.stringify(DEFAULT_EVENTS));
      } else {
        let storedEvents = localStorage.getItem("evt_events");
        if (storedEvents) {
          let parsed = JSON.parse(storedEvents);
          if (!Array.isArray(parsed)) {
            localStorage.setItem("evt_events", JSON.stringify(DEFAULT_EVENTS));
            parsed = DEFAULT_EVENTS;
          }
          let updated = false;
          parsed.forEach(e => {
            if (e.category === "Sagre" || e.category === "Feste patronali") {
              e.category = "Feste di paese";
              updated = true;
            }
          });

          if (updated) {
            localStorage.setItem("evt_events", JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.error("Error initializing events:", e);
      localStorage.setItem("evt_events", JSON.stringify([]));
    }

    try {
      if (!localStorage.getItem("evt_messages")) {
        localStorage.setItem("evt_messages", JSON.stringify(DEFAULT_MESSAGES));
      }
    } catch (e) {
      console.error("Error initializing messages:", e);
    }

    try {
      if (!localStorage.getItem("evt_feedback_done")) {
        localStorage.setItem("evt_feedback_done", JSON.stringify([]));
      }
    } catch (e) {
      console.error("Error initializing feedback_done:", e);
    }

    try {
      if (!localStorage.getItem("evt_community_messages")) {
        localStorage.setItem("evt_community_messages", JSON.stringify([]));
      }
    } catch (e) {
      console.error("Error initializing community messages:", e);
    }
  }

  getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem("evt_users") || "[]");
      if (!Array.isArray(users) || users.length === 0) {
        localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      return users;
    } catch (e) {
      return DEFAULT_USERS;
    }
  }

  saveUsers(users) {
    try {
      localStorage.setItem("evt_users", JSON.stringify(users));
    } catch (e) {}
  }

  getEvents() {
    try {
      const events = JSON.parse(localStorage.getItem("evt_events") || "[]");
      if (!Array.isArray(events)) {
        return [];
      }
      // Strict production filtering rule: exclude demo events and legacy test titles
      return events.filter(e => {
        if (!e || e.isDemo) return false;
        const t = (e.title || "").toLowerCase();
        const d = (e.desc || "").toLowerCase();
        if (t.includes("esempio") || t.includes("zucca") || t.includes("salamella") || t === "ciao" || d === "ciao" || t === "test") return false;
        return true;
      });
    } catch (e) {
      return [];
    }
  }

  saveEvents(events) {
    try {
      localStorage.setItem("evt_events", JSON.stringify(events));
    } catch (e) {}
  }

  getMessages() {
    try {
      return JSON.parse(localStorage.getItem("evt_messages") || "[]");
    } catch (e) {
      return [];
    }
  }

  saveMessages(messages) {
    try {
      localStorage.setItem("evt_messages", JSON.stringify(messages));
    } catch (e) {}
  }

  getFeedbackDone() {
    try {
      return JSON.parse(localStorage.getItem("evt_feedback_done") || "[]");
    } catch (e) {
      return [];
    }
  }

  saveFeedbackDone(done) {
    try {
      localStorage.setItem("evt_feedback_done", JSON.stringify(done));
    } catch (e) {}
  }

  // Auth Functions
  // Auth Functions
  login(credential, password) {
    const users = this.getUsers();
    // Normalize credential: trim whitespace and case‑insensitive email matching
    const normalized = credential.trim();
    const emailNorm = normalized.toLowerCase();
    const user = users.find(u => (
      (u.email && u.email.toLowerCase() === emailNorm) ||
      (u.phone && u.phone === normalized)
    ) && u.password === password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: "Credenziali non valide o password errata." };
  }

  register(userData) {
    const users = this.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPhone = userData.phone.trim();
    // Check constraints
    if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: "Questa email è già associata a un altro account." };
    }
    if (users.some(u => u.phone === cleanPhone)) {
      return { success: false, message: "Questo numero di telefono è già associato a un altro account." };
    }

    const numHash = Math.floor(100000 + Math.random() * 900000);
    const newUser = {
      id: "usr_" + Date.now(),
      collabId: `COL-${numHash}`,
      name: userData.name.trim(),
      cognome: userData.cognome.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      comune: userData.comune.trim(),
      regione: userData.regione,
      password: userData.password,
      role: userData.role || "utente", // 'utente', 'organizzatore'
      interests: userData.interests || [],
      premium: false,
      dateOfBirth: userData.dateOfBirth || "",
      points: 0,
      badges: [],
      goingEvents: []
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

    const cleanFields = { ...updatedFields };
    if (cleanFields.email) {
      cleanFields.email = cleanFields.email.trim().toLowerCase();
    }
    if (cleanFields.phone) {
      cleanFields.phone = cleanFields.phone.trim();
    }
    if (cleanFields.name) cleanFields.name = cleanFields.name.trim();
    if (cleanFields.cognome) cleanFields.cognome = cleanFields.cognome.trim();
    if (cleanFields.comune) cleanFields.comune = cleanFields.comune.trim();

    // Check unique constraints if fields are updated
    if (cleanFields.email && cleanFields.email !== users[index].email) {
      if (users.some(u => u.email && u.email.toLowerCase() === cleanFields.email)) {
        return { success: false, message: "Questa email è già registrata." };
      }
    }
    if (cleanFields.phone && cleanFields.phone !== users[index].phone) {
      if (users.some(u => u.phone === cleanFields.phone)) {
        return { success: false, message: "Questo numero di telefono è già registrato." };
      }
    }

    // Apply updates
    users[index] = { ...users[index], ...cleanFields };
    this.saveUsers(users);
    return { success: true, user: users[index] };
  }

  resetPassword(credential, newPassword) {
    const users = this.getUsers();
    const normalized = credential.trim();
    const emailNorm = normalized.toLowerCase();
    const index = users.findIndex(u => 
      (u.email && u.email.toLowerCase() === emailNorm) || 
      (u.phone && u.phone === normalized)
    );
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

    const users = this.getUsers();
    const organizer = users.find(u => u.id === organizerId);
    const inferredRegion = eventData.regione || organizer?.regione || "Piemonte";

    const newEvent = {
      id: "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      title: eventData.title,
      desc: eventData.desc,
      date: eventData.date,
      time: (eventData.time && eventData.time.trim()) ? eventData.time : "20:00",
      location: eventData.location,
      citta: eventData.citta || eventData.location.split(',')[0] || "Novara",
      provincia: eventData.provincia || "NO",
      regione: inferredRegion,
      cap: eventData.cap || "28040",
      nazione: eventData.nazione || "Italia",
      gps: (eventData.gps && typeof eventData.gps.lat === 'number' && typeof eventData.gps.lng === 'number' && !isNaN(eventData.gps.lat) && !isNaN(eventData.gps.lng))
        ? { lat: parseFloat(eventData.gps.lat), lng: parseFloat(eventData.gps.lng) }
        : null,
      category: eventData.category || "Feste di paese",
      cost: eventData.cost || "Gratuito",
      maxCapacity: parseInt(eventData.maxCapacity) || 0,
      ticketUrl: eventData.ticketUrl || "",
      accessibili: eventData.accessibili !== undefined ? eventData.accessibili : true,
      animali: eventData.animali !== undefined ? eventData.animali : true,
      parcheggio: eventData.parcheggio !== undefined ? eventData.parcheggio : true,
      poster: eventData.poster || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600",
      status: eventData.status || "pubblicato", // pubblicato / bozza / annullato
      visibilita: eventData.visibilita || "pubblico", // pubblico / privato / solo_invitati
      precisionLevel: eventData.precisionLevel || 'street', // house_number / street / place / city / fallback_manual_marker
      invitedUsers: eventData.invitedUsers || [],
      organizerId,
      views: 0,
      interestedUsers: [],
      goingUsers: [],
      savedUsers: [],
      feedback: [],
      updates: [],
      gallery: []
    };

    events.push(newEvent);
    this.saveEvents(events);

    // Notify all followers of this organizer
    const follows = this.getFollows();
    const followers = follows.filter(f => f.organizerId === organizerId);
    const orgName = organizer ? `${organizer.name} ${organizer.cognome}` : 'Un organizzatore che segui';

    followers.forEach(f => {
      const myNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${f.followerId}`) || "[]");
      myNotifs.unshift({
        id: `notif_new_evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: `👑 Nuovo Evento da ${orgName}!`,
        text: `${orgName} ha appena pubblicato "${newEvent.title}" (${newEvent.date} a ${newEvent.citta || newEvent.location}).`,
        timestamp: new Date().toISOString(),
        type: "new_event",
        eventId: newEvent.id,
        read: false
      });
      localStorage.setItem(`evt_notifications_${f.followerId}`, JSON.stringify(myNotifs));
    });

    return { success: true, event: newEvent, warning };
  }

  // Haversine distance calculation in kilometers
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  // Search for nearby events on the exact same date within radius (default 25 km)
  findNearbyEventsOnDate(date, lat, lng, radiusKm = 25, excludeEventId = null) {
    if (!date || !lat || !lng) return [];
    const events = this.getEvents();
    const users = this.getUsers();

    return events.filter(evt => {
      if (excludeEventId && evt.id === excludeEventId) return false;
      if (evt.status === 'annullato') return false;
      if (evt.date !== date) return false;
      if (!evt.gps || typeof evt.gps.lat !== 'number' || typeof evt.gps.lng !== 'number') return false;

      const dist = this.calculateDistanceKm(lat, lng, evt.gps.lat, evt.gps.lng);
      if (dist <= radiusKm) {
        const organizer = users.find(u => u.id === evt.organizerId);
        evt.distanceKm = dist;
        evt.organizerName = organizer ? `${organizer.name} ${organizer.cognome}` : 'Altro Organizzatore';
        return true;
      }
      return false;
    });
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

    const updatedEvent = events[index];
    this.saveEvents(events);

    // Notify participants if major fields changed (date, location, status)
    if (updatedFields.date || updatedFields.time || updatedFields.location || updatedFields.citta || updatedFields.status) {
      const recipients = new Set([
        ...(updatedEvent.goingUsers || []),
        ...(updatedEvent.interestedUsers || []),
        ...(updatedEvent.savedUsers || [])
      ]);

      recipients.forEach(userId => {
        if (userId === editorId) return; // Don't notify the editor
        const myNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${userId}`) || "[]");
        myNotifs.unshift({
          id: `notif_edit_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          title: `✏️ Evento Modificato: ${updatedEvent.title}`,
          text: `L'evento "${updatedEvent.title}" è stato aggiornato dall'organizzatore (Data: ${updatedEvent.date}, Luogo: ${updatedEvent.citta || updatedEvent.location}).`,
          timestamp: new Date().toISOString(),
          type: "update",
          eventId: updatedEvent.id,
          read: false
        });
        localStorage.setItem(`evt_notifications_${userId}`, JSON.stringify(myNotifs));
      });
    }

    return { success: true, event: updatedEvent };
  }

  addBroadcastUpdate(eventId, updateText, senderId) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false, message: "Evento non trovato." };

    const event = events[index];
    const updateObj = {
      id: "upd_" + Date.now(),
      text: updateText,
      timestamp: new Date().toISOString()
    };

    if (!event.updates) event.updates = [];
    event.updates.unshift(updateObj);
    this.saveEvents(events);

    // Broadcast notifications to all going and interested participants
    const recipients = new Set([...(event.goingUsers || []), ...(event.interestedUsers || [])]);
    recipients.forEach(userId => {
      const myNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${userId}`) || "[]");
      myNotifs.unshift({
        id: `notif_bcast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: `📢 Aggiornamento: ${event.title}`,
        text: updateText,
        timestamp: new Date().toISOString(),
        type: "update",
        read: false
      });
      localStorage.setItem(`evt_notifications_${userId}`, JSON.stringify(myNotifs));
    });

    return { success: true, count: recipients.size, event };
  }

  cancelEvent(eventId, cancellerId, reason = '') {
    const events = this.getEvents();
    const users = this.getUsers();
    const index = events.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false, message: "Evento non trovato." };

    const event = events[index];
    const canceller = users.find(u => u.id === cancellerId);

    // Permission check: Owner, invited collaborator, or admin
    const isOwner = event.organizerId === cancellerId;
    const isInvitedCollaborator = canceller && canceller.role === "collaboratore" && canceller.invitedBy === event.organizerId;
    const isAdmin = canceller && (canceller.role === "admin" || canceller.email === "chiara@eventiapp.com");

    if (!isOwner && !isInvitedCollaborator && !isAdmin) {
      return { success: false, message: "Non disponi dell'autorizzazione per annullare questo evento." };
    }

    event.status = "annullato";
    event.cancelledAt = new Date().toISOString();
    event.cancelledBy = cancellerId;
    event.cancellationReason = reason || "Annullato dall'organizzatore";

    this.saveEvents(events);

    // Send internal notification to all going, interested, and saved users
    const recipients = new Set([
      ...(event.goingUsers || []),
      ...(event.interestedUsers || []),
      ...(event.savedUsers || [])
    ]);

    recipients.forEach(userId => {
      if (userId === cancellerId) return; // Do not notify the person cancelling
      const myNotifs = JSON.parse(localStorage.getItem(`evt_notifications_${userId}`) || "[]");
      myNotifs.unshift({
        id: `notif_cancel_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: `🚫 Evento Annullato: ${event.title}`,
        text: `L'evento "${event.title}" previsto per il ${event.date} è stato annullato. ${reason ? `Motivo: ${reason}` : ''}`,
        timestamp: new Date().toISOString(),
        type: "cancellation",
        eventId: event.id,
        read: false
      });
      localStorage.setItem(`evt_notifications_${userId}`, JSON.stringify(myNotifs));
    });

    return { success: true, event, notifiedCount: recipients.size };
  }

  getEventParticipantsList(eventId, requestingUser = null) {
    const events = this.getEvents();
    const users = this.getUsers();
    const event = events.find(e => e.id === eventId);
    if (!event) return [];

    // Privacy Guard: Normal participants CANNOT access private attendee list
    if (requestingUser) {
      const isOwner = event.organizerId === requestingUser.id;
      const isInvitedCollab = requestingUser.role === "collaboratore" && requestingUser.invitedBy === event.organizerId;
      const isAdmin = requestingUser.role === "admin" || requestingUser.email === "chiara@eventiapp.com";
      if (!isOwner && !isInvitedCollab && !isAdmin) {
        return []; // Unauthorized request returns empty list
      }
    }

    const list = [];

    const processUser = (uId, statusStr, typeKey) => {
      const u = users.find(user => user.id === uId);
      if (!u || list.some(item => item.id === u.id)) return;

      const hasConsent = u.shareContactWithOrganizer === true;
      list.push({
        id: u.id,
        name: `${u.name || 'Utente'} ${u.cognome || ''}`.trim(),
        email: hasConsent ? u.email : '🔒 Non condiviso',
        phone: hasConsent ? (u.phone || 'Non specificato') : '🔒 Non condiviso',
        hasConsent,
        status: statusStr,
        typeKey: typeKey,
        joinedAt: event.date,
        avatar: u.avatar
      });
    };

    (event.goingUsers || []).forEach(uId => processUser(uId, 'Partecipo', 'going'));
    (event.interestedUsers || []).forEach(uId => processUser(uId, 'Mi interessa', 'interested'));
    (event.savedUsers || []).forEach(uId => processUser(uId, 'Salvato', 'saved'));

    return list;
  }

  // Follow Organizers Management
  getFollows() {
    try {
      const data = localStorage.getItem("evt_follows");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveFollows(follows) {
    try {
      localStorage.setItem("evt_follows", JSON.stringify(follows));
    } catch (e) {}
  }

  isFollowing(followerId, organizerId) {
    if (!followerId || !organizerId) return false;
    const follows = this.getFollows();
    return follows.some(f => f.followerId === followerId && f.organizerId === organizerId);
  }

  getFollowersCount(organizerId) {
    if (!organizerId) return 0;
    const follows = this.getFollows();
    return follows.filter(f => f.organizerId === organizerId).length;
  }

  getFollowingCount(followerId) {
    if (!followerId) return 0;
    const follows = this.getFollows();
    return follows.filter(f => f.followerId === followerId).length;
  }

  toggleFollow(followerId, organizerId) {
    if (!followerId || !organizerId) return { success: false, message: "Utente o organizzatore non valido." };
    if (followerId === organizerId) {
      return { success: false, message: "Non puoi seguire te stesso!" };
    }

    const follows = this.getFollows();
    const index = follows.findIndex(f => f.followerId === followerId && f.organizerId === organizerId);
    let isFollowing = false;

    if (index === -1) {
      follows.push({
        id: `flw_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        followerId,
        organizerId,
        createdAt: new Date().toISOString()
      });
      isFollowing = true;
    } else {
      follows.splice(index, 1);
      isFollowing = false;
    }

    this.saveFollows(follows);
    return { success: true, isFollowing, count: this.getFollowersCount(organizerId) };
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
    if (!Array.isArray(event.goingUsers)) event.goingUsers = [];
    if (!Array.isArray(event.interestedUsers)) event.interestedUsers = [];
    if (!Array.isArray(event.savedUsers)) event.savedUsers = [];
    
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
        // Enforce max capacity limit
        if (event.maxCapacity && event.maxCapacity > 0 && event.goingUsers.length >= event.maxCapacity) {
          return { success: false, message: "Spiacenti, i posti per questo evento sono esauriti (SOLD OUT)! 🚫" };
        }
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

  // Real-time Cloud Sync for Community Messages
  async syncCloudCommunityMessages() {
    try {
      const res = await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ee2e-7add-8688-ce66e2df0bd5', { cache: 'no-store' });
      let remoteMsgs = [];
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          remoteMsgs = data.messages;
          _cloudCommunityCache = remoteMsgs;
        }
      } else {
        remoteMsgs = _cloudCommunityCache;
      }

      const local = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
      const localIds = new Set(local.map(m => m.id));
      let hasNew = false;

      remoteMsgs.forEach(remoteMsg => {
        if (!localIds.has(remoteMsg.id)) {
          local.push(remoteMsg);
          hasNew = true;
        }
      });

      if (hasNew) {
        local.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        localStorage.setItem("evt_community_messages", JSON.stringify(local));
      }
    } catch (e) {
      if (_cloudCommunityCache.length > 0) {
        const local = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
        const localIds = new Set(local.map(m => m.id));
        let hasNew = false;
        _cloudCommunityCache.forEach(remoteMsg => {
          if (!localIds.has(remoteMsg.id)) {
            local.push(remoteMsg);
            hasNew = true;
          }
        });
        if (hasNew) {
          local.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          localStorage.setItem("evt_community_messages", JSON.stringify(local));
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_community_updated'));
    }
  }

  async pushCommunityMessageToCloud(newMessage) {
    try {
      const local = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
      let currentMessages = [];
      try {
        const res = await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ee2e-7add-8688-ce66e2df0bd5', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.messages)) {
            currentMessages = data.messages;
          }
        }
      } catch (e) {
        currentMessages = _cloudCommunityCache;
      }
      
      const mergedMap = new Map();
      currentMessages.forEach(m => mergedMap.set(m.id, m));
      local.forEach(m => mergedMap.set(m.id, m));
      if (newMessage) mergedMap.set(newMessage.id, newMessage);

      const allMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      _cloudCommunityCache = allMerged;

      await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ee2e-7add-8688-ce66e2df0bd5', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMerged })
      });
    } catch (e) {
      if (newMessage && !_cloudCommunityCache.some(m => m.id === newMessage.id)) {
        _cloudCommunityCache.push(newMessage);
      }
    }
  }

  // Real-time Cloud Sync for Private Messages
  async syncCloudPrivateMessages() {
    try {
      const res = await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ede9-7ee9-a9b5-a3a4ee973bdb', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          const local = this.getMessages();
          const localIds = new Set(local.map(m => m.id));
          let hasNew = false;

          data.messages.forEach(remoteMsg => {
            if (!localIds.has(remoteMsg.id)) {
              local.push(remoteMsg);
              hasNew = true;
            }
          });

          if (hasNew) {
            local.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            this.saveMessages(local);
          }
        }
      }
    } catch (e) { }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_chat_updated'));
    }
  }

  async pushPrivateMessageToCloud(newMessage) {
    try {
      const local = this.getMessages();
      const res = await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ede9-7ee9-a9b5-a3a4ee973bdb', { cache: 'no-store' });
      let currentMessages = [];
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          currentMessages = data.messages;
        }
      }

      const mergedMap = new Map();
      currentMessages.forEach(m => mergedMap.set(m.id, m));
      local.forEach(m => mergedMap.set(m.id, m));
      if (newMessage) mergedMap.set(newMessage.id, newMessage);

      const allMerged = Array.from(mergedMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ede9-7ee9-a9b5-a3a4ee973bdb', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMerged })
      });
    } catch (e) { }
  }

  getCommunityMessages(eventId, currentUserId = null) {
    const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
    const users = this.getUsers();
    const events = this.getEvents();
    const evt = events.find(e => String(e.id) === String(eventId));
    const organizerId = evt ? evt.organizerId : null;

    return all
      .filter(m => String(m.eventId) === String(eventId))
      .map(m => {
        const u = users.find(usr => String(usr.id) === String(m.userId));
        const isOrganizer = String(m.userId) === String(organizerId);
        const isCollaborator = u && u.role === 'collaboratore' && String(u.invitedBy) === String(organizerId);
        const likes = Array.isArray(m.likes) ? m.likes : [];
        const hasLiked = currentUserId ? likes.includes(currentUserId) : false;

        return {
          ...m,
          userName: u ? `${u.name} ${u.cognome}` : m.userName,
          userAvatar: u ? u.avatar : m.userAvatar,
          userRole: u ? u.role : 'utente',
          isOrganizer,
          isCollaborator,
          likesCount: likes.length,
          hasLiked
        };
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  toggleCommunityMessageLike(messageId, userId) {
    const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
    const msgIndex = all.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return { success: false };

    const msg = all[msgIndex];
    if (!Array.isArray(msg.likes)) msg.likes = [];
    const idx = msg.likes.indexOf(userId);
    let liked = false;

    if (idx === -1) {
      msg.likes.push(userId);
      liked = true;
    } else {
      msg.likes.splice(idx, 1);
    }

    localStorage.setItem("evt_community_messages", JSON.stringify(all));
    try {
      this.pushCommunityMessageToCloud(msg).catch(() => {});
    } catch (e) { }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_community_updated'));
    }

    return { success: true, liked, likesCount: msg.likes.length };
  }

  async addCommunityMessage(eventId, userId, userName, userAvatar, text) {
    const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
    const newMessage = {
      id: "cm_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      eventId,
      userId,
      userName,
      userAvatar: userAvatar || "",
      text,
      timestamp: new Date().toISOString()
    };
    all.push(newMessage);
    localStorage.setItem("evt_community_messages", JSON.stringify(all));

    // Push to global cloud endpoint for multi-device cross-browser real-time sync
    await this.pushCommunityMessageToCloud(newMessage);

    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'NEW_COMMUNITY_MESSAGE', data: newMessage });
      } catch (e) { }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_community_updated'));
    }

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

  deleteCommunityMessage(eventId, messageId, requestingUserId) {
    const all = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
    const msgIndex = all.findIndex(m => m.id === messageId && m.eventId === eventId);
    if (msgIndex === -1) return { success: false, message: "Messaggio non trovato." };

    const msg = all[msgIndex];
    const events = this.getEvents();
    const evt = events.find(e => e.id === eventId);
    const users = this.getUsers();
    const user = users.find(u => u.id === requestingUserId);

    const isAuthor = msg.userId === requestingUserId;
    const isOwner = evt && evt.organizerId === requestingUserId;
    const isCollaborator = user && user.role === 'collaboratore' && evt && evt.organizerId === user.invitedBy;

    if (!isAuthor && !isOwner && !isCollaborator) {
      return { success: false, message: "Non autorizzato ad eliminare questo messaggio." };
    }

    all.splice(msgIndex, 1);
    localStorage.setItem("evt_community_messages", JSON.stringify(all));

    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'NEW_COMMUNITY_MESSAGE', data: { id: messageId, deleted: true } });
      } catch (e) { }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_community_updated'));
    }

    return { success: true };
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
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      eventId,
      senderId,
      receiverId,
      message: text,
      timestamp: new Date().toISOString()
    };
    msgs.push(newMessage);
    this.saveMessages(msgs);

    // Push to global cloud endpoint for multi-device cross-browser real-time sync
    this.pushPrivateMessageToCloud(newMessage);

    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'NEW_PRIVATE_MESSAGE', data: newMessage });
      } catch (e) { }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_chat_updated'));
    }

    return newMessage;
  }

  deletePrivateChat(eventId, user1, user2) {
    let msgs = this.getMessages();
    msgs = msgs.filter(m => !(
      m.eventId === eventId &&
      ((m.senderId === user1 && m.receiverId === user2) || (m.senderId === user2 && m.receiverId === user1))
    ));
    this.saveMessages(msgs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_chat_updated'));
    }
    return { success: true };
  }

  addEventReview(eventId, userId, userName, rating, comment) {
    const events = this.getEvents();
    const evtIndex = events.findIndex(e => e.id === eventId);
    if (evtIndex === -1) return { success: false, message: "Evento non trovato." };

    if (!events[evtIndex].feedback) {
      events[evtIndex].feedback = [];
    }

    const newReview = {
      id: "rev_" + Date.now(),
      userId,
      userName,
      rating: parseInt(rating) || 5,
      text: comment.trim(),
      date: new Date().toISOString()
    };

    events[evtIndex].feedback.unshift(newReview);
    this.saveEvents(events);
    return { success: true, review: newReview, event: events[evtIndex] };
  }

  // Invite existing user or collaborator by ID
  inviteCollaboratorById(organizerId, targetId) {
    const users = this.getUsers();
    const cleanId = targetId ? targetId.trim().toUpperCase() : '';
    if (!cleanId) return { success: false, message: "Inserisci un ID Collaboratore o Email valida." };

    const targetUser = users.find(u => 
      u.id.toUpperCase() === cleanId || 
      (u.collabId && u.collabId.toUpperCase() === cleanId) ||
      u.email.toUpperCase() === cleanId
    );

    if (!targetUser) {
      return { success: false, message: `Nessun utente trovato con l'ID o l'Email "${targetId}".` };
    }

    if (targetUser.id === organizerId) {
      return { success: false, message: "Non puoi invitare te stesso come collaboratore." };
    }

    if (targetUser.invitedBy === organizerId && targetUser.role === 'collaboratore') {
      return { success: false, message: `${targetUser.name} ${targetUser.cognome} è già un tuo collaboratore.` };
    }

    targetUser.role = "collaboratore";
    targetUser.invitedBy = organizerId;
    this.saveUsers(users);
    return { success: true, collaborator: targetUser };
  }

  // Invite & Create Collaborator
  inviteCollaborator(organizerId, email, name, cognome, phone, password) {
    const users = this.getUsers();
    
    if (users.some(u => u.email === email)) {
      return { success: false, message: "Questa email è già associata a un account." };
    }

    const numHash = Math.floor(100000 + Math.random() * 900000);
    const newCollaborator = {
      id: "col_" + Date.now(),
      collabId: `COL-${numHash}`,
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

  // Remove Collaborator
  removeCollaborator(collaboratorId, organizerId) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === collaboratorId && u.role === "collaboratore" && u.invitedBy === organizerId);
    if (index === -1) {
      return { success: false, message: "Collaboratore non trovato o autorizzazione negata." };
    }
    users.splice(index, 1);
    this.saveUsers(users);
    return { success: true };
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

  // Delete Event (Organizer, Collaborator, or Admin)
  deleteEvent(eventId, userId) {
    const events = this.getEvents();
    const users = this.getUsers();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      return { success: false, message: "Evento non trovato." };
    }

    const eventObj = events[eventIndex];
    const requestingUser = users.find(u => u.id === userId);
    
    // Check permission: Owner, Invited Collaborator, or Admin/Chiara
    const isOwner = eventObj.organizerId === userId;
    const isCollab = requestingUser && requestingUser.role === 'collaboratore' && requestingUser.invitedBy === eventObj.organizerId;
    const isAdmin = requestingUser && (requestingUser.email === 'chiara@eventiapp.com' || requestingUser.role === 'admin');

    if (!isOwner && !isCollab && !isAdmin) {
      return { success: false, message: "Autorizzazione negata: solo l'organizzatore o l'amministratore possono eliminare questo evento." };
    }

    // Remove event
    events.splice(eventIndex, 1);
    this.saveEvents(events);

    // Clean community chat messages for deleted event
    try {
      const commMsgs = JSON.parse(localStorage.getItem('evt_community_messages') || '[]');
      const filtered = commMsgs.filter(m => m.eventId !== eventId);
      localStorage.setItem('evt_community_messages', JSON.stringify(filtered));
    } catch (e) {}

    return { success: true, message: "Evento eliminato con successo." };
  }

  // Update User Bio
  updateUserBio(userId, bioText) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, message: "Utente non trovato." };

    const bio = (bioText || "").substring(0, 250);
    users[userIndex].bio = bio;
    this.saveUsers(users);
    return { success: true, user: users[userIndex] };
  }

  // Password reset request by email
  requestPasswordResetEmail(emailInput) {
    const users = this.getUsers();
    const cleanEmail = (emailInput || "").toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: "Indirizzo e-mail non trovato nel sistema." };
    }

    // Generate a temporary 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      message: `Codice di recupero inviato all'indirizzo ${user.email}. Usa il codice per impostare una nuova password.`,
      email: user.email,
      resetCode
    };
  }

  // Get aggregated statistics for an event (views, going, interested, geo provenance, age ranges)
  getEventStats(eventId) {
    const events = this.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return {
        views: 0,
        going: 0,
        interested: 0,
        saved: 0,
        geo: [],
        age: []
      };
    }

    const users = this.getUsers();
    const goingUserIds = event.goingUsers || [];
    const interestedUserIds = event.interestedUsers || [];

    const participantIds = [...new Set([...goingUserIds, ...interestedUserIds])];
    const participants = users.filter(u => participantIds.includes(u.id));

    // Calculate Geo Provenance
    const geoCount = {};
    participants.forEach(p => {
      const city = p.comune || 'Sconosciuto';
      geoCount[city] = (geoCount[city] || 0) + 1;
    });
    const geoArray = Object.entries(geoCount).sort((a, b) => b[1] - a[1]);

    // Calculate Age Ranges
    const currentYear = new Date().getFullYear();
    const ageCount = { '18-24': 0, '25-34': 0, '35-49': 0, '50+': 0 };
    participants.forEach(p => {
      if (p.dateOfBirth) {
        const birthYear = new Date(p.dateOfBirth).getFullYear();
        if (birthYear) {
          const age = currentYear - birthYear;
          if (age >= 18 && age <= 24) ageCount['18-24']++;
          else if (age >= 25 && age <= 34) ageCount['25-34']++;
          else if (age >= 35 && age <= 49) ageCount['35-49']++;
          else if (age >= 50) ageCount['50+']++;
        }
      }
    });
    const ageArray = Object.entries(ageCount).filter(([_, count]) => count > 0);

    return {
      views: event.views || 0,
      going: goingUserIds.length,
      interested: interestedUserIds.length,
      saved: (event.savedUsers || []).length,
      geo: geoArray,
      age: ageArray
    };
  }
}

export const db = new LocalDB();
