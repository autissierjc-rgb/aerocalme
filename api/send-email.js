module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    nom, email, tel, msg,
    previsionText,
    lieuType, surface, hauteur, style, budget, probleme
  } = req.body || {};

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return res.status(500).json({ error: 'Clé Resend non configurée.' });

  const send = (payload) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify(payload),
    });

  const fromAddress = 'AeroCalme <onboarding@resend.dev>';

  /* ── Email interne ─────────────────────────────────────────────── */
  const internalHtml = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0d0d0d;color:#e8e6df;padding:32px">
  <h2 style="color:#C8951A;font-weight:300;margin-bottom:24px">Nouvelle demande de devis — AéroCalme</h2>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:6px 0;color:#8a8880;width:160px">Nom / Société</td><td style="padding:6px 0">${nom || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Email</td><td style="padding:6px 0">${email || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Téléphone</td><td style="padding:6px 0">${tel || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Type de lieu</td><td style="padding:6px 0">${lieuType || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Surface</td><td style="padding:6px 0">${surface ? surface + ' m²' : '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Hauteur</td><td style="padding:6px 0">${hauteur ? hauteur + ' m' : '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Style</td><td style="padding:6px 0">${style || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8880">Budget</td><td style="padding:6px 0">${budget || '—'}</td></tr>
  </table>

  <h3 style="color:#C8951A;font-weight:300;margin-bottom:8px">Problème acoustique</h3>
  <p style="background:#1a1a2e;padding:16px;border-left:3px solid #C8951A;margin-bottom:24px">${(probleme || '—').replace(/\n/g,'<br>')}</p>

  ${msg ? `<h3 style="color:#C8951A;font-weight:300;margin-bottom:8px">Message complémentaire</h3>
  <p style="background:#1a1a2e;padding:16px;border-left:3px solid #C8951A;margin-bottom:24px">${msg.replace(/\n/g,'<br>')}</p>` : ''}

  <h3 style="color:#C8951A;font-weight:300;margin-bottom:8px">Pré-vision générée</h3>
  <div style="background:#12122a;padding:20px;border:1px solid #2a2a4a;white-space:pre-wrap;font-size:13px;line-height:1.7">${(previsionText || '—').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`;

  /* ── Email confirmation prospect ────────────────────────────────── */
  const confirmHtml = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0d0d0d;color:#e8e6df;padding:32px">
  <h2 style="color:#C8951A;font-weight:300;margin-bottom:8px">AéroCalme</h2>
  <p style="color:#8a8880;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px">Sculptures acoustiques suspendues</p>

  <p>Bonjour${nom ? ' ' + nom : ''},</p>
  <br>
  <p>Votre demande a bien été reçue. Nous reviendrons vers vous sous <strong style="color:#C8951A">48 heures ouvrées</strong> pour une consultation approfondie.</p>
  <br>
  <p style="color:#8a8880;font-size:13px">Votre pré-vision :</p>
  <div style="background:#12122a;padding:20px;border:1px solid #2a2a4a;margin:12px 0;white-space:pre-wrap;font-size:13px;line-height:1.7">${(previsionText || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
  <br>
  <p style="color:#8a8880;font-size:12px">Pré-vision non contractuelle — AéroCalme 2026</p>
</div>`;

  try {
    const r1 = await send({
      from: fromAddress,
      to: ['contact@aerocalme.fr'],
      cc: ['autissierjc@gmail.com'],
      reply_to: email || undefined,
      subject: `Devis AéroCalme — ${nom || 'Prospect'} — ${lieuType || ''}`,
      html: internalHtml,
    });
    if (!r1.ok) {
      const err = await r1.json().catch(() => ({}));
      return res.status(r1.status).json({ error: err?.message || 'Erreur envoi email interne.' });
    }

    if (email) {
      await send({
        from: fromAddress,
        to: [email],
        subject: 'Votre demande AéroCalme a bien été reçue',
        html: confirmHtml,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
