import './polyfill.js';
import { db } from './src/services/db.js';
import { fetchLiveWeather } from './src/services/weather.js';

function log(label, obj) {
  console.log('\n===', label, '===');
  console.log(JSON.stringify(obj, null, 2));
}

(async () => {
  // Reset storage and DB
  global.localStorage.clear();
  // Force DB init (constructor already runs init)
  new db.constructor();

  // 1. Login with case‑insensitive email
  const login1 = db.login('USER@EVENTS.COM', 'password123');
  log('Login case‑insensitive', login1);

  // 2. Register a new user and login
  const newUser = {
    name: 'Luca',
    cognome: 'Verdi',
    email: '  Luca@Example.Com  ', // with spaces and capitals
    phone: '3311122233',
    comune: 'Bergamo',
    regione: 'Lombardia',
    password: 'pass123',
    role: 'utente'
  };
  const reg = db.register(newUser);
  log('Register new user', reg);
  const loginNew = db.login('LUCA@EXAMPLE.COM', 'pass123');
  log('Login new user mixed case', loginNew);

  // 3. Reset password and re‑login
  const reset = db.resetPassword('  luca@example.com  ', 'newpass');
  log('Reset password', reset);
  const loginAfterReset = db.login('luca@example.com', 'newpass');
  log('Login after reset', loginAfterReset);

  // 4. Create a new event with GPS, capacity and ticket URL
  const organizer = db.login('organizer@events.com', 'password123').user;
  const eventData = {
    title: 'Evento Test Full',
    desc: 'Evento di prova con tutti i feature.',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    location: 'Test City',
    gps: { lat: 45.0, lng: 9.0 },
    category: 'Escursioni',
    cost: 'Gratuito',
    accessibili: true,
    animali: false,
    parcheggio: true,
    maps_link: 'https://maps.google.com',
    poster: 'https://example.com/poster.jpg',
    maxCapacity: 3,
    ticketUrl: 'example.com/ticket'
  };
  const createRes = db.createEvent(eventData, organizer.id);
  log('Create event', createRes);

  // 5. Verify live weather fetch (fallback if offline)
  const weather = await fetchLiveWeather(eventData.gps.lat, eventData.gps.lng);
  log('Live weather data', weather);

  // 6. Participation flow – fill capacity
  const eventId = createRes.event.id;
  const participants = ['usr_1', 'usr_2', 'usr_3'];
  participants.forEach((uid, i) => {
    const part = db.toggleParticipation(eventId, uid, 'going');
    console.log(`Participant ${i + 1} (ID ${uid}) going: ${part.success ? 'OK' : 'FAIL'} ${part.message || ''}`);
  });
  // Attempt over‑capacity participation
  const over = db.toggleParticipation(eventId, 'usr_4', 'going');
  console.log('Over‑capacity attempt:', over.success ? 'OK' : 'FAIL', over.message);

  // 7. Ticket URL handling – ensure proper prefix
  const ticketLink = createRes.event.ticketUrl.startsWith('http') ? createRes.event.ticketUrl : `https://${createRes.event.ticketUrl}`;
  log('Ticket URL resolved', ticketLink);

  // 8. Calendar export URLs
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(createRes.event.title);
    const details = encodeURIComponent(createRes.event.desc);
    const location = encodeURIComponent(createRes.event.location);
    const dateFormatted = createRes.event.date.replace(/-/g, '');
    const startTime = createRes.event.time.replace(/:/g, '') + '00';
    const endTime = (parseInt(createRes.event.time.split(':')[0]) + 2) + createRes.event.time.split(':')[1] + '00';
    const dates = `${dateFormatted}T${startTime}/${dateFormatted}T${endTime}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };
  log('Google Calendar URL', getGoogleCalendarUrl());

  // 9. Add a photo to the event gallery
  const photoRes = db.addPhotoToEvent(eventId, 'https://example.com/photo1.jpg', 'usr_2', 'Luca Verdi');
  log('Add photo', photoRes);

  // 10. Like the photo with another user
  const likeRes = db.togglePhotoLike(eventId, photoRes.event.gallery[0].id, 'usr_3');
  log('Toggle like', likeRes);

  // 11. Post a community message
  const msgRes = db.addCommunityMessage(eventId, 'usr_1', 'Luca Verdi', '', 'Ciao, questo evento è fantastico!');
  log('Community message', msgRes);

  // 12. Export iCalendar (simulate by calling internal logic)
  const downloadIcsFile = () => {
    const e = createRes.event;
    const title = e.title;
    const desc = e.desc.replace(/\\n/g, '\\\\n');
    const location = e.location;
    const dateFormatted = e.date.replace(/-/g, '');
    const startTime = e.time.replace(/:/g, '') + '00';
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${desc}\nLOCATION:${location}\nDTSTART:${dateFormatted}T${startTime}\nDTEND:${dateFormatted}T${(parseInt(e.time.split(':')[0]) + 2) + e.time.split(':')[1]}00\nEND:VEVENT\nEND:VCALENDAR`;
    return icsContent;
  };
  log('iCalendar content', downloadIcsFile());

  // 13. Map directions URL generation
  const openDirections = (app) => {
    const { lat, lng } = createRes.event.gps;
    let url = '';
    if (app === 'google') url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    else if (app === 'apple') url = `maps://maps.apple.com/?daddr=${lat},${lng}`;
    else if (app === 'waze') url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    return url;
  };
  log('Google Maps direction URL', openDirections('google'));
  log('Apple Maps direction URL', openDirections('apple'));
  log('Waze direction URL', openDirections('waze'));
})();
