module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'string'
    ? JSON.parse(req.body)
    : (req.body || {});

  const { pdfBase64, jmeno, prijmeni, email, tel } = body;

  if (!pdfBase64) {
    return res.status(400).json({ ok: false, error: 'Missing pdfBase64' });
  }

  const fullName = [prijmeni, jmeno].filter(Boolean).join(' ') || 'Neznámý';
  const datum = new Date().toLocaleDateString('cs-CZ', { timeZone: 'Europe/Prague' });

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Přihlášky <onboarding@resend.dev>',
        to: ['menffisto@gmail.com'],
        subject: `Nová podepsaná přihláška — ${fullName}`,
        html: `<table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">
          <tr><td style="padding:6px 14px 6px 0;color:#666">Jméno:</td><td><strong>${fullName}</strong></td></tr>
          <tr><td style="padding:6px 14px 6px 0;color:#666">E-mail:</td><td>${email || '—'}</td></tr>
          <tr><td style="padding:6px 14px 6px 0;color:#666">Telefon:</td><td>${tel || '—'}</td></tr>
          <tr><td style="padding:6px 14px 6px 0;color:#666">Datum podání:</td><td>${datum}</td></tr>
        </table>
        <p style="font-family:sans-serif;font-size:14px;color:#555;margin-top:16px">
          Podepsaná přihláška je přílohou tohoto e-mailu (prihlaska.pdf).
        </p>`,
        attachments: [{
          filename: 'prihlaska.pdf',
          content: pdfBase64,
        }],
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return res.status(500).json({ ok: false, error: errText });
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || 'Unknown error' });
  }
};
