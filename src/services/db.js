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

const DEFAULT_EVENTS = [];

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
    try {
      if (!localStorage.getItem("evt_users")) {
        localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
      } else {
        let storedUsers = localStorage.getItem("evt_users");
        if (storedUsers) {
          let parsed = JSON.parse(storedUsers);
          if (!Array.isArray(parsed)) {
            localStorage.setItem("evt_users", JSON.stringify(DEFAULT_USERS));
            parsed = DEFAULT_USERS;
          }
          let updated = false;
          parsed.forEach(u => {
            if (!u.avatar) {
              if (u.id === "usr_1") u.avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150";
              else if (u.id === "org_1") u.avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
              else if (u.id === "col_1") u.avatar = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150";
              else u.avatar = "";
              updated = true;
            }
            if (!u.collabId) {
              const numHash = Math.abs(u.id.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)) % 899999 + 100000;
              u.collabId = `COL-${numHash}`;
              updated = true;
            }
          });
          if (updated) {
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
      localStorage.setItem("evt_events", JSON.stringify([]));
      localStorage.setItem("evt_production_ready", "true");
    }

    try {
      if (!localStorage.getItem("evt_events")) {
        localStorage.setItem("evt_events", JSON.stringify([]));
      } else {
        let storedEvents = localStorage.getItem("evt_events");
        if (storedEvents) {
          let parsed = JSON.parse(storedEvents);
          if (!Array.isArray(parsed)) {
            localStorage.setItem("evt_events", JSON.stringify([]));
            parsed = [];
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
    } catch (e) {
      console.error("Error initializing community messages:", e);
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem("evt_users") || "[]");
    } catch (e) {
      return [];
    }
  }

  saveUsers(users) {
    try {
      localStorage.setItem("evt_users", JSON.stringify(users));
    } catch (e) {}
  }

  getEvents() {
    try {
      return JSON.parse(localStorage.getItem("evt_events") || "[]");
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
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          const local = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
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
            localStorage.setItem("evt_community_messages", JSON.stringify(local));
          }
        }
      }
    } catch (e) { }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('evt_community_updated'));
    }
  }

  async pushCommunityMessageToCloud(newMessage) {
    try {
      const local = JSON.parse(localStorage.getItem("evt_community_messages") || "[]");
      const res = await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ee2e-7add-8688-ce66e2df0bd5', { cache: 'no-store' });
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

      await fetch('https://jsonblob.com/api/jsonBlob/019f8ddd-ee2e-7add-8688-ce66e2df0bd5', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMerged })
      });
    } catch (e) { }
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

  getCommunityMessages(eventId) {
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
        return {
          ...m,
          userName: u ? `${u.name} ${u.cognome}` : m.userName,
          userAvatar: u ? u.avatar : m.userAvatar,
          userRole: u ? u.role : 'utente',
          isOrganizer,
          isCollaborator
        };
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  addCommunityMessage(eventId, userId, userName, userAvatar, text) {
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
    this.pushCommunityMessageToCloud(newMessage);

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
}

export const db = new LocalDB();
