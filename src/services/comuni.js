// Database dei comuni italiani principali e delle province per ricerca istantanea e geolocalizzazione precisa

export const COMUNI_ITALIA = [
  { name: "Comignago", prov: "NO", region: "Piemonte", lat: 45.7166, lng: 8.5605 },
  { name: "Paruzzaro", prov: "NO", region: "Piemonte", lat: 45.7502, lng: 8.5176 },
  { name: "Oleggio", prov: "NO", region: "Piemonte", lat: 45.5982, lng: 8.6369 },
  { name: "Cuggiono", prov: "MI", region: "Lombardia", lat: 45.5083, lng: 8.8167 },
  { name: "Saronno", prov: "VA", region: "Lombardia", lat: 45.6264, lng: 9.0347 },
  { name: "Legnano", prov: "MI", region: "Lombardia", lat: 45.5966, lng: 8.9174 },
  { name: "Monza", prov: "MB", region: "Lombardia", lat: 45.5845, lng: 9.2740 },
  { name: "Milano", prov: "MI", region: "Lombardia", lat: 45.4642, lng: 9.1900 },
  { name: "Bergamo", prov: "BG", region: "Lombardia", lat: 45.6983, lng: 9.6773 },
  { name: "Brescia", prov: "BS", region: "Lombardia", lat: 45.5416, lng: 10.2118 },
  { name: "Como", prov: "CO", region: "Lombardia", lat: 45.8081, lng: 9.0852 },
  { name: "Varese", prov: "VA", region: "Lombardia", lat: 45.8206, lng: 8.8251 },
  { name: "Sondrio", prov: "SO", region: "Lombardia", lat: 46.2415, lng: 9.6372 },
  { name: "Novara", prov: "NO", region: "Piemonte", lat: 45.4469, lng: 8.6214 },
  { name: "Torino", prov: "TO", region: "Piemonte", lat: 45.0703, lng: 7.6869 },
  { name: "Verbania", prov: "VB", region: "Piemonte", lat: 45.9221, lng: 8.5516 },
  { name: "Arona", prov: "NO", region: "Piemonte", lat: 45.7588, lng: 8.5606 },
  { name: "Borgomanero", prov: "NO", region: "Piemonte", lat: 45.7008, lng: 8.4616 },
  { name: "Bellinzago Novarese", prov: "NO", region: "Piemonte", lat: 45.5681, lng: 8.6475 },
  { name: "Gallarate", prov: "VA", region: "Lombardia", lat: 45.6631, lng: 8.7924 },
  { name: "Busto Arsizio", prov: "VA", region: "Lombardia", lat: 45.6120, lng: 8.8516 },
  { name: "Magenta", prov: "MI", region: "Lombardia", lat: 45.4646, lng: 8.8837 },
  { name: "Abbiategrasso", prov: "MI", region: "Lombardia", lat: 45.4007, lng: 8.9174 },
  { name: "Castano Primo", prov: "MI", region: "Lombardia", lat: 45.5516, lng: 8.7774 },
  { name: "Turbigo", prov: "MI", region: "Lombardia", lat: 45.5306, lng: 8.7369 },
  { name: "Inveruno", prov: "MI", region: "Lombardia", lat: 45.5161, lng: 8.8531 },
  { name: "Rescaldina", prov: "MI", region: "Lombardia", lat: 45.6186, lng: 8.9567 },
  { name: "Cerro Maggiore", prov: "MI", region: "Lombardia", lat: 45.5966, lng: 8.9500 },
  { name: "San Vittore Olona", prov: "MI", region: "Lombardia", lat: 45.5833, lng: 8.9333 },
  { name: "Parabiago", prov: "MI", region: "Lombardia", lat: 45.5561, lng: 8.9483 },
  { name: "Nerviano", prov: "MI", region: "Lombardia", lat: 45.5528, lng: 8.9744 },
  { name: "Rho", prov: "MI", region: "Lombardia", lat: 45.5303, lng: 9.0406 },
  { name: "Bollate", prov: "MI", region: "Lombardia", lat: 45.5456, lng: 9.1172 },
  { name: "Paderno Dugnano", prov: "MI", region: "Lombardia", lat: 45.5714, lng: 9.1678 },
  { name: "Cinisello Balsamo", prov: "MI", region: "Lombardia", lat: 45.5558, lng: 9.2133 },
  { name: "Sesto San Giovanni", prov: "MI", region: "Lombardia", lat: 45.5331, lng: 9.2272 },
  { name: "Roma", prov: "RM", region: "Lazio", lat: 41.9028, lng: 12.4964 },
  { name: "Bologna", prov: "BO", region: "Emilia-Romagna", lat: 44.4949, lng: 11.3426 },
  { name: "Firenze", prov: "FI", region: "Toscana", lat: 43.7696, lng: 11.2558 },
  { name: "Napoli", prov: "NA", region: "Campania", lat: 40.8518, lng: 14.2681 },
  { name: "Genova", prov: "GE", region: "Liguria", lat: 44.4056, lng: 8.9463 },
  { name: "Venezia", prov: "VE", region: "Veneto", lat: 45.4408, lng: 12.3155 },
  { name: "Verona", prov: "VR", region: "Veneto", lat: 45.4384, lng: 10.9916 },
  { name: "Padova", prov: "PD", region: "Veneto", lat: 45.4064, lng: 11.8768 },
  { name: "Palermo", prov: "PA", region: "Sicilia", lat: 38.1157, lng: 13.3615 },
  { name: "Catania", prov: "CT", region: "Sicilia", lat: 37.5079, lng: 15.0830 },
  { name: "Bari", prov: "BA", region: "Puglia", lat: 41.1171, lng: 16.8719 },
  { name: "Lecce", prov: "LE", region: "Puglia", lat: 40.3515, lng: 18.1750 },
  { name: "Cagliari", prov: "CA", region: "Sardegna", lat: 39.2238, lng: 9.1217 },
  { name: "Pavia", prov: "PV", region: "Lombardia", lat: 45.1847, lng: 9.1582 },
  { name: "Lodi", prov: "LO", region: "Lombardia", lat: 45.3139, lng: 9.5031 },
  { name: "Cremona", prov: "CR", region: "Lombardia", lat: 45.1336, lng: 10.0247 },
  { name: "Mantova", prov: "MN", region: "Lombardia", lat: 45.1564, lng: 10.7914 },
  { name: "Piacenza", prov: "PC", region: "Emilia-Romagna", lat: 45.0526, lng: 9.6930 },
  { name: "Parma", prov: "PR", region: "Emilia-Romagna", lat: 44.8015, lng: 10.3279 },
  { name: "Modena", prov: "MO", region: "Emilia-Romagna", lat: 44.6471, lng: 10.9252 },
  { name: "Reggio Emilia", prov: "RE", region: "Emilia-Romagna", lat: 44.6983, lng: 10.6312 },
  { name: "Ferrara", prov: "FE", region: "Emilia-Romagna", lat: 44.8381, lng: 11.6198 },
  { name: "Ravenna", prov: "RA", region: "Emilia-Romagna", lat: 44.4184, lng: 12.2035 },
  { name: "Rimini", prov: "RN", region: "Emilia-Romagna", lat: 44.0678, lng: 12.5695 }
];

/**
 * Cerca comuni italiani corrispondenti alla stringa di ricerca (anche parziale)
 */
export function searchItalianComuni(query) {
  if (!query || query.trim().length < 2) return [];
  const cleanQ = query.trim().toLowerCase();

  // 1. Cerca prima corrispondenze nel database locale italiano
  const localMatches = COMUNI_ITALIA.filter(c => 
    c.name.toLowerCase().includes(cleanQ) || 
    c.prov.toLowerCase() === cleanQ ||
    `${c.name.toLowerCase()} (${c.prov.toLowerCase()})`.includes(cleanQ)
  ).map(c => ({
    label: `${c.name} (${c.prov})`,
    fullTitle: `${c.name} (${c.prov}), ${c.region}, Italia`,
    lat: c.lat.toFixed(4),
    lng: c.lng.toFixed(4),
    town: c.name,
    prov: c.prov,
    region: c.region
  }));

  return localMatches;
}
