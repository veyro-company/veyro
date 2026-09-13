const https = require('https');

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ok:false});
  const sessionId = String(req.query.session_id || '');
  if (!sessionId.startsWith('cs_test_')) return res.status(400).json({ok:false});
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ok:false});
  try {
    const r = await stripeGet(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (r.status !== 200) return res.status(401).json({ok:false});
    const s = r.body;
    const ok = s.payment_status === 'paid' && s.mode === 'payment' && s.amount_total === 1999 && s.currency === 'pln';
    if (!ok) return res.status(403).json({ok:false});
    return res.status(200).json({ok:true, email:s.customer_details?.email || null});
  } catch { return res.status(500).json({ok:false}); }
};
