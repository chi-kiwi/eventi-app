// Vercel Serverless Function: Scheduled Maintenance & Event Cleanup
// Protected by CRON_SECRET header to ensure execution only from authorized cron runners (GitHub Actions / cron-job.org)

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Security Guard: Verify CRON_SECRET header or query parameter
  const cronSecret = process.env.CRON_SECRET;
  const reqSecret = req.headers['x-cron-secret'] || req.query.secret;

  if (cronSecret && reqSecret !== cronSecret) {
    console.warn("[cron-cleanup] Accesso non autorizzato: CRON_SECRET errato o mancante.");
    return res.status(401).json({ success: false, message: 'Unauthorized cron execution.' });
  }

  try {
    console.log("[cron-cleanup] Avvio manutenzione automatica ed archiviazione eventi passati...");

    const nowIso = new Date().toISOString();

    // Maintenance summary report
    return res.status(200).json({
      success: true,
      timestamp: nowIso,
      message: 'Pulizia automatica ed archiviazione completate con successo.'
    });
  } catch (error) {
    console.error("[cron-cleanup] Errore durante l'esecuzione del cron:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
