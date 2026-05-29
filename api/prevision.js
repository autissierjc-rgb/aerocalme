const SYSTEM_PROMPT = `Tu es l'assistant de pré-création AéroCalme. Mission : Transformer les informations fournies par un prospect en pré-vision de projet pour une installation acoustique suspendue monumentale. AéroCalme conçoit des sculptures acoustiques suspendues pour grands volumes : planètes, nuages, halos, vagues, constellations, formes sur mesure. Règles : ne jamais garantir une baisse de décibels, ne jamais promettre une performance chiffrée sans mesure, toujours préciser que la pré-vision est non contractuelle, parler de réduction de réverbération et confort sonore. Sortie : 1.Nom du projet 2.Lecture du lieu 3.Concept proposé 4.Formes recommandées 5.Matériaux probables 6.Logique d'implantation 7.Effet acoustique recherché 8.Complexité : simple/intermédiaire/monumental 9.Étapes suivantes 10.Disclaimer`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'Paramètres invalides.' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Clé API non configurée.' } });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};
